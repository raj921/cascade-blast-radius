"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Preset } from "@/lib/repo-context";
import type { BlastRadiusAnalysis, RiskLevel } from "@/types/analysis";
import { EXAMPLE_UNIFIED_DIFF } from "@/lib/example-diff";

interface Props {
  presets: Preset[];
  bobReady: boolean;
  bobBlockedMessage: string | null;
  engineLabel: string;
  initialPresetId?: string | null;
  /** Optional deep-link: `/analyze?pr=https%3A%2F%2Fgithub.com%2Fowner%2Frepo%2Fpull%2F1` */
  initialPrUrl?: string | null;
}

type Phase = "idle" | "parse" | "context" | "analyze" | "stream" | "json" | "done" | "error";

interface DiffSummary {
  files: Array<{
    path: string;
    additions: number;
    deletions: number;
    hunks: number;
    candidateSymbols: string[];
  }>;
  totalAdditions: number;
  totalDeletions: number;
  engine: string;
  preset: string | null;
}

interface ErrorEvent {
  code: string;
  message: string;
  raw?: unknown;
  issues?: unknown;
}

export default function AnalyzeClient({
  presets,
  bobReady,
  bobBlockedMessage,
  engineLabel,
  initialPresetId,
  initialPrUrl,
}: Props) {
  const initialPreset = initialPresetId
    ? presets.find((p) => p.id === initialPresetId) ?? null
    : null;
  const [diff, setDiff] = useState(initialPreset?.diff ?? "");
  const [activePreset, setActivePreset] = useState<string | null>(
    initialPreset?.id ?? null
  );
  /** Head versions of changed files from POST /api/github (max 10). Sent with custom diff runs only. */
  const [contextFiles, setContextFiles] = useState<
    Array<{ path: string; content: string }>
  >([]);
  const [prUrl, setPrUrl] = useState(initialPrUrl ?? "");
  const [githubToken, setGithubToken] = useState("");
  const [prTitle, setPrTitle] = useState<string | null>(null);
  const [prTotalFiles, setPrTotalFiles] = useState<number | null>(null);
  const [fetchingPr, setFetchingPr] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");

  const [reasoning, setReasoning] = useState("");
  const [trace, setTrace] = useState("");
  const [partialJson, setPartialJson] = useState("");
  const [diffSummary, setDiffSummary] = useState<DiffSummary | null>(null);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [final, setFinal] = useState<BlastRadiusAnalysis | null>(null);
  const [error, setError] = useState<ErrorEvent | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [ttft, setTtft] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const tStartRef = useRef<number>(0);
  const autoFiredRef = useRef(false);

  useEffect(() => {
    if (phase !== "idle" && phase !== "done" && phase !== "error") {
      const id = setInterval(() => {
        setElapsed(Date.now() - tStartRef.current);
      }, 47);
      return () => clearInterval(id);
    }
  }, [phase]);

  const reset = useCallback(() => {
    setReasoning("");
    setTrace("");
    setPartialJson("");
    setFinal(null);
    setError(null);
    setStatusLog([]);
    setDiffSummary(null);
    setTtft(null);
    setElapsed(0);
  }, []);

  const applyPreset = (p: Preset) => {
    setActivePreset(p.id);
    setDiff(p.diff);
    setContextFiles([]);
    setPrTitle(null);
    setPrTotalFiles(null);
    reset();
    setPhase("idle");
  };

  const fetchPrFromGitHub = async () => {
    const url = prUrl.trim();
    if (!url) return;
    setFetchingPr(true);
    setError(null);
    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          token: githubToken.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        diff?: string;
        files?: Array<{ path: string; content: string; status?: string }>;
        filesCount?: number;
        totalChangedFiles?: number;
        pr?: { title: string };
      };
      if (!res.ok || data.error) {
        setError({
          code: "GITHUB",
          message: data.error ?? `HTTP ${res.status}`,
        });
        setPhase("error");
        return;
      }
      setDiff(data.diff ?? "");
      setContextFiles(
        (data.files ?? []).map((f) => ({ path: f.path, content: f.content }))
      );
      setPrTitle(data.pr?.title ?? null);
      setPrTotalFiles(
        typeof data.totalChangedFiles === "number"
          ? data.totalChangedFiles
          : (data.files ?? []).length
      );
      setActivePreset(null);
      reset();
      setPhase("idle");
    } catch (e) {
      setError({ code: "GITHUB", message: (e as Error).message });
      setPhase("error");
    } finally {
      setFetchingPr(false);
    }
  };

  const run = useCallback(
    async (overrides?: { preset?: string; diffOverride?: string }) => {
      reset();
      setPhase("parse");
      tStartRef.current = Date.now();

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const presetId = overrides?.preset ?? activePreset ?? undefined;
        const usePreset = !!presetId;
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            preset: presetId,
            diff:
              overrides?.diffOverride ??
              (usePreset ? undefined : diff.trim() || undefined),
            files:
              usePreset || contextFiles.length === 0
                ? undefined
                : contextFiles,
          }),
          signal: ac.signal,
        });

        if (!res.ok || !res.body) {
          const text = await res.text();
          setError({ code: "HTTP", message: text || `HTTP ${res.status}` });
          setPhase("error");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let idx;
          while ((idx = buf.indexOf("\n\n")) !== -1) {
            const raw = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            handleEvent(raw);
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError({ code: "FETCH", message: (err as Error).message });
          setPhase("error");
        }
      }
    },
    [activePreset, contextFiles, diff, reset]
  );

  const handleEvent = (raw: string) => {
    const lines = raw.split("\n");
    let event = "message";
    let data = "";
    for (const l of lines) {
      if (l.startsWith("event:")) event = l.slice(6).trim();
      else if (l.startsWith("data:")) data += l.slice(5).trim();
    }
    if (!data) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }

    switch (event) {
      case "status": {
        const { phase: ph, message } = parsed as { phase: Phase; message: string };
        setPhase(ph);
        setStatusLog((s) => [...s, `[${ph}] ${message}`]);
        if (message.startsWith("ttft ")) {
          const ms = Number(message.replace("ttft ", "").replace("ms", ""));
          if (!Number.isNaN(ms)) setTtft(ms);
        }
        break;
      }
      case "diff_summary":
        setDiffSummary(parsed as DiffSummary);
        break;
      case "reasoning":
        setReasoning((r) => r + (parsed as { text: string }).text);
        break;
      case "trace":
        setTrace((t) => t + (parsed as { text: string }).text);
        break;
      case "partial_json":
        setPartialJson((parsed as { text: string }).text);
        break;
      case "final": {
        const { analysis, elapsed_ms } = parsed as {
          analysis: BlastRadiusAnalysis;
          elapsed_ms: number;
        };
        setFinal(analysis);
        setElapsed(elapsed_ms);
        break;
      }
      case "done":
        setPhase("done");
        break;
      case "error":
        setError(parsed as ErrorEvent);
        setPhase("error");
        break;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setPhase("idle");
  };

  // Auto-run if landed with ?preset=...
  useEffect(() => {
    if (autoFiredRef.current) return;
    if (!initialPreset || !bobReady) return;
    autoFiredRef.current = true;
    void run({ preset: initialPreset.id, diffOverride: initialPreset.diff });
  }, [initialPreset, bobReady, run]);

  const isRunning =
    phase !== "idle" && phase !== "done" && phase !== "error";

  return (
    <div className="space-y-8">
      <PageHeader phase={phase} elapsed={elapsed} ttft={ttft} engineLabel={engineLabel} />

      {!bobReady && bobBlockedMessage && (
        <BobBlockedNotice message={bobBlockedMessage} />
      )}

      <section className="space-y-3 border hairline p-4 bg-[color:var(--color-surface)]">
        <div className="label">// github pull request</div>
        <p className="text-[11px] text-[color:var(--color-muted-foreground)] leading-relaxed max-w-3xl">
          Works with{" "}
          <span className="text-[color:var(--color-foreground)]">
            any public GitHub pull request
          </span>{" "}
          (paste the PR URL). Fetches the full unified diff plus up to 10
          changed-file snapshots from the PR head via{" "}
          <code className="text-[color:var(--color-primary)]">/api/github</code>
          . Private repos need a token with repo scope. Then{" "}
          <span className="text-[color:var(--color-foreground)]">
            Run cascade
          </span>{" "}
          sends diff + snippets to Bob Shell (
          <code className="text-[color:var(--color-primary)]">bob</code> CLI +{" "}
          <code className="text-[color:var(--color-primary)]">
            BOBSHELL_API_KEY
          </code>
          ).
        </p>
        <div className="flex flex-col gap-2">
          <input
            type="url"
            spellCheck={false}
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            placeholder="https://github.com/owner/repo/pull/123"
            className="w-full bg-[color:var(--color-background)] border hairline px-3 py-2 text-[12px] font-mono outline-none focus:border-[color:var(--color-primary)]"
          />
          <input
            type="password"
            spellCheck={false}
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="GitHub token (optional — rate limits; required for private repos)"
            autoComplete="off"
            className="w-full bg-[color:var(--color-background)] border hairline px-3 py-2 text-[12px] font-mono outline-none focus:border-[color:var(--color-primary)]"
          />
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={() => void fetchPrFromGitHub()}
              disabled={fetchingPr || !prUrl.trim()}
              className="px-4 py-2 border border-[color:var(--color-border-strong)] text-xs uppercase tracking-[0.18em] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] disabled:opacity-30"
            >
              {fetchingPr ? "Fetching…" : "↓ fetch PR"}
            </button>
            {prTitle && (
              <span className="text-[11px] text-[color:var(--color-muted-foreground)] truncate max-w-xl">
                Loaded: {prTitle} · Bob context: {contextFiles.length}
                {prTotalFiles != null && prTotalFiles > contextFiles.length
                  ? ` of ${prTotalFiles} changed files`
                  : prTotalFiles != null
                    ? ` changed file${prTotalFiles === 1 ? "" : "s"}`
                    : ""}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Preset chips */}
      <section className="space-y-3">
        <div className="label">// presets</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((p) => (
            <PresetCard
              key={p.id}
              preset={p}
              active={activePreset === p.id}
              onSelect={() => applyPreset(p)}
              onRun={() => {
                setActivePreset(p.id);
                setDiff(p.diff);
                void run({ preset: p.id, diffOverride: p.diff });
              }}
              disabled={isRunning}
            />
          ))}
        </div>
      </section>

      {/* Editor + live panel */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6">
        <DiffEditor
          value={diff}
          onChange={(v) => {
            setDiff(v);
            setActivePreset(null);
            setContextFiles([]);
            setPrTitle(null);
            setPrTotalFiles(null);
          }}
          onLoadExample={() => {
            setDiff(EXAMPLE_UNIFIED_DIFF);
            setActivePreset(null);
            setContextFiles([]);
            setPrTitle(null);
            setPrTotalFiles(null);
            reset();
            setPhase("idle");
          }}
          onRun={() => run()}
          onStop={stop}
          isRunning={isRunning}
          hasKey={bobReady}
        />
        <LivePanel
          phase={phase}
          statusLog={statusLog}
          reasoning={reasoning}
          trace={trace}
          partialJson={partialJson}
          diffSummary={diffSummary}
          error={error}
        />
      </section>

      {/* Final result */}
      {final && <FinalReport analysis={final} elapsedMs={elapsed} />}
    </div>
  );
}

/* ───────────── components ───────────── */

function PageHeader({
  phase,
  elapsed,
  ttft,
  engineLabel,
}: {
  phase: Phase;
  elapsed: number;
  ttft: number | null;
  engineLabel: string;
}) {
  return (
    <header className="border hairline-strong bracket-frame p-6 md:p-8 relative bg-[color:var(--color-surface)]">
      <span className="bl" />
      <span className="br" />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="label mb-2">/02 · analyze</div>
          <h1 className="font-display text-5xl md:text-6xl leading-none">
            <span className="italic">Predict</span> the blast radius{" "}
            <span className="text-[color:var(--color-muted-foreground)]">
              before the merge.
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--color-muted-foreground)]">
            Paste a git diff, or fire a preset. IBM Bob Shell runs the
            cascade-architect instructions server-side, streams stdout/stderr
            over SSE, and validates the fenced JSON before it hits the impact
            table.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] num">
          <div>Phase</div>
          <div>TTFT</div>
          <div>Elapsed</div>
          <div className="text-[color:var(--color-foreground)] text-sm">
            {phase}
          </div>
          <div className="text-[color:var(--color-foreground)] text-sm">
            {ttft !== null ? `${ttft}ms` : "—"}
          </div>
          <div className="text-[color:var(--color-foreground)] text-sm">
            {(elapsed / 1000).toFixed(2)}s
          </div>
          <div className="col-span-3 mt-2 text-[10px]">
            engine:{" "}
            <span className="text-[color:var(--color-foreground)]">{engineLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function BobBlockedNotice({ message }: { message: string }) {
  return (
    <div className="border hairline p-4 risk-HIGH flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
      <div>
        <span className="label block mb-1">// configuration</span>
        <span className="text-[color:var(--color-high)]">{message}</span>{" "}
        <span className="text-[color:var(--color-foreground)]">
          Baked reports under /demos still work without Bob.
        </span>
      </div>
      <code className="font-mono text-xs px-2 py-1 bg-[color:var(--color-background)] border hairline whitespace-nowrap">
        cp .env.example .env.local
      </code>
    </div>
  );
}

function PresetCard({
  preset,
  active,
  onSelect,
  onRun,
  disabled,
}: {
  preset: Preset;
  active: boolean;
  onSelect: () => void;
  onRun: () => void;
  disabled: boolean;
}) {
  const riskClass = `risk-${preset.expectedRisk}`;
  return (
    <div
      className={`group border hairline p-4 cursor-pointer transition-colors ${
        active
          ? "border-[color:var(--color-primary)] bg-[color:var(--color-surface)]"
          : "hover:border-[color:var(--color-border-strong)]"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`pill ${riskClass}`}>{preset.expectedRisk}</span>
        <span className="label">{preset.id.toUpperCase()}</span>
      </div>
      <h3 className="font-display text-2xl mb-1 italic">{preset.title}</h3>
      <p className="text-xs text-[color:var(--color-muted-foreground)] leading-relaxed mb-4">
        {preset.blurb}
      </p>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em]">
        <span className="text-[color:var(--color-muted-foreground)]">
          {preset.contextFiles.length} ctx files
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRun();
          }}
          disabled={disabled}
          className="px-3 py-1.5 border border-[color:var(--color-primary)] text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] disabled:opacity-30 transition-colors"
        >
          Run ▸
        </button>
      </div>
    </div>
  );
}

function DiffEditor({
  value,
  onChange,
  onLoadExample,
  onRun,
  onStop,
  isRunning,
  hasKey,
}: {
  value: string;
  onChange: (v: string) => void;
  onLoadExample: () => void;
  onRun: () => void;
  onStop: () => void;
  isRunning: boolean;
  hasKey: boolean;
}) {
  return (
    <div className="border hairline bracket-frame relative bg-[color:var(--color-surface)]">
      <span className="bl" />
      <span className="br" />
      <div className="flex items-center justify-between px-4 py-2 border-b hairline">
        <span className="label">// input · unified diff</span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] num">
          {value.split("\n").length} lines
        </span>
      </div>
      <textarea
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`diff --git a/services/foo.ts b/services/foo.ts\n--- a/services/foo.ts\n+++ b/services/foo.ts\n@@ -1,3 +1,3 @@\n-export function foo(x: string): boolean {\n+export function foo(x: string): { ok: boolean } {\n   ...\n }`}
        className="w-full h-[420px] bg-transparent text-[13px] leading-[1.55] font-mono p-4 outline-none resize-none placeholder:text-[color:var(--color-muted)]"
      />
      <div className="flex items-center justify-between px-4 py-3 border-t hairline">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          {hasKey ? (
            <>
              <span className="text-[color:var(--color-primary)]">●</span> agent
              online
            </>
          ) : (
            <>
              <span className="text-[color:var(--color-high)]">●</span> agent
              offline
            </>
          )}
        </span>
        <div className="flex flex-wrap gap-2 justify-end">
          {!isRunning && (
            <button
              type="button"
              onClick={onLoadExample}
              className="px-3 py-2 border border-[color:var(--color-border-strong)] text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
            >
              load example
            </button>
          )}
          {isRunning ? (
            <button
              onClick={onStop}
              className="px-4 py-2 border border-[color:var(--color-critical)] text-[color:var(--color-critical)] text-xs uppercase tracking-[0.18em] hover:bg-[color:var(--color-critical)] hover:text-[color:var(--color-primary-foreground)] transition-colors"
            >
              ■ abort
            </button>
          ) : (
            <button
              onClick={onRun}
              disabled={!value.trim()}
              className="px-5 py-2 bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] text-xs uppercase tracking-[0.18em] font-bold hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed glow-lime"
            >
              ▸ run cascade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LivePanel({
  phase,
  statusLog,
  reasoning,
  trace,
  partialJson,
  diffSummary,
  error,
}: {
  phase: Phase;
  statusLog: string[];
  reasoning: string;
  trace: string;
  partialJson: string;
  diffSummary: DiffSummary | null;
  error: ErrorEvent | null;
}) {
  const [tab, setTab] = useState<"reason" | "trace" | "json" | "status">(
    "trace"
  );
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [reasoning, trace, partialJson, statusLog]);

  const tabs: Array<{ id: typeof tab; label: string; count: number }> = [
    { id: "trace", label: "trace", count: trace.length },
    { id: "reason", label: "reasoning", count: reasoning.length },
    { id: "json", label: "json", count: partialJson.length },
    { id: "status", label: "status", count: statusLog.length },
  ];

  const content = (() => {
    if (error) {
      return (
        <div className="risk-CRITICAL p-4 border">
          <div className="label mb-2">// error · {error.code}</div>
          <div className="text-sm">{error.message}</div>
          {error.raw ? (
            <pre className="text-[11px] mt-3 opacity-70 overflow-auto max-h-40">
              {typeof error.raw === "string"
                ? error.raw
                : JSON.stringify(error.raw, null, 2)}
            </pre>
          ) : null}
        </div>
      );
    }

    switch (tab) {
      case "trace":
        return trace ? (
          <pre className="text-[12px] leading-[1.6] whitespace-pre-wrap">
            {trace}
            {phase !== "done" && phase !== "error" && (
              <span className="animate-pulse text-[color:var(--color-primary)]">
                ▌
              </span>
            )}
          </pre>
        ) : (
          <EmptyHint label="Waiting for analyst trace…" />
        );
      case "reason":
        return reasoning ? (
          <pre className="text-[12px] leading-[1.6] whitespace-pre-wrap text-[color:var(--color-muted-foreground)] italic">
            {reasoning}
          </pre>
        ) : (
          <EmptyHint label="Bob Shell stderr / progress (often empty until the run finishes)." />
        );
      case "json":
        return partialJson ? (
          <pre className="text-[11px] leading-[1.5] text-[color:var(--color-primary)]">
            {partialJson}
          </pre>
        ) : (
          <EmptyHint label="Structured output not yet streaming." />
        );
      case "status":
        return (
          <pre className="text-[11px] leading-[1.6] text-[color:var(--color-muted-foreground)]">
            {statusLog.join("\n") || "(no events yet)"}
          </pre>
        );
    }
  })();

  return (
    <div className="border hairline bracket-frame relative bg-[color:var(--color-background)] scanlines">
      <span className="bl" />
      <span className="br" />
      <div className="flex items-center justify-between px-4 py-2 border-b hairline">
        <span className="label">// telemetry · live</span>
        <span className="pill pill-live">{phase}</span>
      </div>
      {diffSummary && <DiffSummaryStrip s={diffSummary} />}
      <div className="flex border-b hairline">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 text-[10px] uppercase tracking-[0.18em] border-r hairline last:border-r-0 transition-colors ${
              tab === t.id
                ? "bg-[color:var(--color-surface)] text-[color:var(--color-primary)]"
                : "text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
            }`}
          >
            {t.label} <span className="num">{t.count > 0 ? t.count : ""}</span>
          </button>
        ))}
      </div>
      <div
        ref={logRef}
        className="p-4 h-[420px] overflow-auto"
      >
        {content}
      </div>
    </div>
  );
}

function DiffSummaryStrip({ s }: { s: DiffSummary }) {
  return (
    <div className="px-4 py-3 border-b hairline text-[11px] flex flex-wrap items-center gap-x-5 gap-y-1 num">
      <span className="text-[color:var(--color-muted-foreground)]">
        files:{" "}
        <span className="text-[color:var(--color-foreground)]">
          {s.files.length}
        </span>
      </span>
      <span className="text-[color:var(--color-primary)]">
        +{s.totalAdditions}
      </span>
      <span className="text-[color:var(--color-critical)]">
        −{s.totalDeletions}
      </span>
      <span className="text-[color:var(--color-muted-foreground)]">
        engine:{" "}
        <span className="text-[color:var(--color-foreground)]">{s.engine}</span>
      </span>
      {s.preset && (
        <span className="pill">{s.preset}</span>
      )}
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
      <span>{label}</span>
    </div>
  );
}

/* ───────────── Final Report ───────────── */

function FinalReport({
  analysis,
  elapsedMs,
}: {
  analysis: BlastRadiusAnalysis;
  elapsedMs: number;
}) {
  return (
    <section className="space-y-6 fade-up">
      <div className="flex items-center justify-between border-b hairline-strong pb-3">
        <div>
          <div className="label mb-1">// report · final</div>
          <h2 className="font-display text-4xl italic">Blast radius</h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] num">
          <span className={`pill risk-${analysis.summary.overall_risk}`}>
            {analysis.summary.overall_risk}
          </span>
          <span className="text-[color:var(--color-muted-foreground)]">
            {(elapsedMs / 1000).toFixed(2)}s
          </span>
        </div>
      </div>

      <SummaryGrid s={analysis.summary} />

      <ChangedSymbols symbols={analysis.changed_symbols} />

      <ImpactTable impacts={analysis.impacts} />

      {analysis.suggested_regression_tests.length > 0 && (
        <SuggestedTests tests={analysis.suggested_regression_tests} />
      )}

      {analysis.missing_tests.length > 0 && (
        <MissingTests items={analysis.missing_tests} />
      )}

      <div className="text-[11px] text-[color:var(--color-muted-foreground)] uppercase tracking-[0.18em] text-center pt-4">
        ▾ paste into a PR comment · or fork the analysis at{" "}
        <Link href="/demos" className="text-[color:var(--color-primary)]">
          /demos
        </Link>
      </div>
    </section>
  );
}

function SummaryGrid({
  s,
}: {
  s: BlastRadiusAnalysis["summary"];
}) {
  const items = [
    { label: "overall", value: s.overall_risk, risk: s.overall_risk as RiskLevel },
    { label: "files", value: String(s.files_affected) },
    { label: "cross-svc", value: s.cross_service ? "yes" : "no" },
    { label: "critical", value: String(s.critical_impacts), risk: "CRITICAL" as RiskLevel },
    { label: "high", value: String(s.high_impacts), risk: "HIGH" as RiskLevel },
    { label: "medium", value: String(s.medium_impacts), risk: "MEDIUM" as RiskLevel },
    { label: "low", value: String(s.low_impacts), risk: "LOW" as RiskLevel },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-7 border hairline">
      {items.map((it, i) => (
        <div
          key={it.label}
          className={`p-4 border-r hairline last:border-r-0 ${
            i >= 5 ? "border-t md:border-t-0" : ""
          }`}
        >
          <div className="label mb-2">{it.label}</div>
          <div
            className={`text-2xl num ${
              it.risk ? `text-[color:var(--color-${it.risk.toLowerCase() === "critical" ? "critical" : it.risk.toLowerCase() === "high" ? "high" : it.risk.toLowerCase() === "medium" ? "medium" : "low"})]` : ""
            }`}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChangedSymbols({
  symbols,
}: {
  symbols: BlastRadiusAnalysis["changed_symbols"];
}) {
  return (
    <div className="border hairline">
      <div className="px-4 py-2 border-b hairline label">
        // changed symbols ({symbols.length})
      </div>
      <div className="divide-y divide-[color:var(--color-border)]">
        {symbols.map((s, i) => (
          <div key={i} className="p-4 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
            <div>
              <div className="text-[11px] text-[color:var(--color-muted-foreground)]">
                {s.file}
              </div>
              <div className="font-mono mt-1">
                <span className="text-[color:var(--color-primary)]">
                  {s.symbol}
                </span>{" "}
                <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                  {s.kind}
                </span>
              </div>
            </div>
            <div className="space-y-1 text-[12px] font-mono">
              <div className="text-[color:var(--color-critical)]">
                − {s.old_sig}
              </div>
              <div className="text-[color:var(--color-primary)]">
                + {s.new_sig}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactTable({
  impacts,
}: {
  impacts: BlastRadiusAnalysis["impacts"];
}) {
  return (
    <div className="border hairline">
      <div className="px-4 py-2 border-b hairline label">
        // impacts ({impacts.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b hairline text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
              <th className="text-left px-4 py-2">risk</th>
              <th className="text-left px-4 py-2">file</th>
              <th className="text-left px-4 py-2 num">line</th>
              <th className="text-left px-4 py-2">symbol</th>
              <th className="text-left px-4 py-2">reason</th>
              <th className="text-left px-4 py-2">kind</th>
            </tr>
          </thead>
          <tbody>
            {impacts.map((imp, i) => (
              <tr
                key={i}
                className="border-b hairline last:border-b-0 hover:bg-[color:var(--color-surface)] fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td className="px-4 py-3">
                  <span className={`pill risk-${imp.risk}`}>{imp.risk}</span>
                </td>
                <td className="px-4 py-3 font-mono">{imp.file}</td>
                <td className="px-4 py-3 num text-[color:var(--color-muted-foreground)]">
                  {imp.line}
                </td>
                <td className="px-4 py-3 font-mono text-[color:var(--color-primary)]">
                  {imp.symbol}
                </td>
                <td className="px-4 py-3">{imp.reason}</td>
                <td className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)]">
                  {imp.indirect ? "indirect" : "direct"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SuggestedTests({
  tests,
}: {
  tests: BlastRadiusAnalysis["suggested_regression_tests"];
}) {
  return (
    <div className="space-y-3">
      <div className="label">// regression tests ({tests.length})</div>
      {tests.map((t, i) => (
        <CodeBlock key={i} path={t.path} code={t.code} />
      ))}
    </div>
  );
}

function MissingTests({
  items,
}: {
  items: BlastRadiusAnalysis["missing_tests"];
}) {
  return (
    <div className="border hairline">
      <div className="px-4 py-2 border-b hairline label">
        // missing tests ({items.length})
      </div>
      <ul className="divide-y divide-[color:var(--color-border)]">
        {items.map((m, i) => (
          <li key={i} className="px-4 py-3 text-sm flex gap-4">
            <span className="font-mono text-[11px] text-[color:var(--color-muted-foreground)] min-w-[20ch]">
              {m.file}
            </span>
            <span>{m.scenario}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeBlock({ path, code }: { path: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="border hairline">
      <div className="flex items-center justify-between px-4 py-2 border-b hairline">
        <span className="text-[11px] font-mono text-[color:var(--color-muted-foreground)]">
          {path}
        </span>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-primary)] hover:opacity-70"
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <pre className="text-[12px] leading-[1.55] p-4 overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}
