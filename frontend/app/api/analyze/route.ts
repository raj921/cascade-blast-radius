import { NextRequest } from "next/server";
import {
  BlastRadiusSchema,
  SYSTEM_PROMPT,
  buildUserPrompt,
  extractJsonBlock,
} from "@/lib/cascade-prompt";
import { summariseDiff } from "@/lib/diff-parser";
import {
  bobBinaryAvailable,
  CASCADE_BOB_ENGINE,
  hasBobShellApiKey,
  isBobShellReady,
  runBobShellStreaming,
} from "@/lib/bob-shell";
import {
  PRESETS,
  readMonorepoFiles,
  type Preset,
} from "@/lib/repo-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalyzeRequest {
  diff?: string;
  preset?: string;
  hint?: string;
  /** @deprecated Ignored — analysis runs on IBM Bob Shell only. */
  model?: string;
  files?: Array<{ path: string; content: string }>;
}

function bobTimeoutMs(): number {
  const raw = process.env.BOB_SHELL_TIMEOUT_MS;
  if (!raw) return 900_000;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 900_000;
}

export async function POST(req: NextRequest) {
  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let diff = body.diff?.trim() ?? "";
  let files: Array<{ path: string; content: string }> = body.files ?? [];
  let presetMeta: Preset | null = null;

  if (body.preset) {
    const p = PRESETS[body.preset];
    if (!p) {
      return new Response(
        JSON.stringify({ error: `Unknown preset: ${body.preset}` }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    presetMeta = p;
    if (!diff) diff = p.diff;
    if (files.length === 0) files = await readMonorepoFiles(p.contextFiles);
  }

  if (!diff) {
    return new Response(
      JSON.stringify({ error: "Provide either `diff` or `preset`." }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          closed = true;
        }
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const tStart = Date.now();
      let assistantText = "";
      let firstChunkAt: number | null = null;
      let inFence = false;

      try {
        send("status", { phase: "parse", message: "parsing diff" });
        const summary = summariseDiff(diff);
        send("diff_summary", {
          ...summary,
          engine: CASCADE_BOB_ENGINE,
          preset: presetMeta?.id ?? null,
        });

        if (!hasBobShellApiKey()) {
          send("error", {
            code: "NO_KEY",
            message:
              "BOBSHELL_API_KEY is not set on the server. Add frontend/.env.local — see .env.example and Bob portal (Inference API key).",
          });
          finish();
          return;
        }

        if (!bobBinaryAvailable()) {
          send("error", {
            code: "NO_BOB",
            message:
              "The `bob` CLI is not on PATH. Install IBM Bob Shell and ensure `bob --help` works in the same environment as Next.js.",
          });
          finish();
          return;
        }

        send("status", {
          phase: "context",
          message: `loaded ${files.length} context file(s)`,
        });

        send("status", {
          phase: "analyze",
          message: `invoking ${CASCADE_BOB_ENGINE} (non-interactive)`,
        });

        const userPrompt = buildUserPrompt({
          diff,
          repoFiles: files,
          hint: body.hint,
        });

        const stdinBody = `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

        const timeoutMs = bobTimeoutMs();
        const result = await runBobShellStreaming(
          stdinBody,
          {
            onStdoutChunk: (chunk) => {
              if (firstChunkAt === null) {
                firstChunkAt = Date.now();
                send("status", {
                  phase: "stream",
                  message: `ttft ${firstChunkAt - tStart}ms`,
                });
              }
              assistantText += chunk;
              send("trace", { text: chunk });

              if (!inFence && assistantText.includes("```json")) {
                inFence = true;
                send("status", {
                  phase: "json",
                  message: "structured output incoming",
                });
              }
              const block = extractJsonBlock(assistantText);
              if (block) send("partial_json", { text: block });
            },
            onStderrChunk: (chunk) => {
              if (firstChunkAt === null) {
                firstChunkAt = Date.now();
                send("status", {
                  phase: "stream",
                  message: `ttft ${firstChunkAt - tStart}ms`,
                });
              }
              send("reasoning", { text: chunk });
            },
          },
          timeoutMs
        );

        const combined =
          assistantText +
          (result.stderr ? `\n[stderr]\n${result.stderr}` : "");

        if (result.exitCode !== 0) {
          send("status", {
            phase: "analyze",
            message: `bob exited with code ${result.exitCode}`,
          });
        }

        const jsonBlock = extractJsonBlock(combined) ?? extractJsonBlock(result.stdout);
        if (!jsonBlock) {
          send("error", {
            code: "NO_JSON",
            message: "Bob did not return a parseable ```json fenced block.",
            raw: combined.slice(-800),
          });
          finish();
          return;
        }

        send("partial_json", { text: jsonBlock });

        let parsed: unknown;
        try {
          parsed = JSON.parse(jsonBlock);
        } catch (err) {
          send("error", {
            code: "JSON_PARSE",
            message: (err as Error).message,
            raw: jsonBlock.slice(0, 800),
          });
          finish();
          return;
        }

        const validated = BlastRadiusSchema.safeParse(parsed);
        if (!validated.success) {
          send("error", {
            code: "SCHEMA",
            message: "Bob output failed schema validation",
            issues: validated.error.issues.slice(0, 8),
            raw: parsed,
          });
          finish();
          return;
        }

        const elapsed = Date.now() - tStart;
        send("final", { analysis: validated.data, elapsed_ms: elapsed });
        send("done", { elapsed_ms: elapsed });
      } catch (err) {
        send("error", {
          code: "RUNTIME",
          message: (err as Error).message,
        });
      } finally {
        finish();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      hint: "POST a JSON body: { diff?, preset?, hint?, files? }",
      engine: CASCADE_BOB_ENGINE,
      hasBobShellApiKey: hasBobShellApiKey(),
      bobBinaryAvailable: bobBinaryAvailable(),
      bobReady: isBobShellReady(),
      presets: Object.keys(PRESETS),
    }),
    { headers: { "content-type": "application/json" } }
  );
}
