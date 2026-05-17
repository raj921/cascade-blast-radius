import { z } from "zod";

/**
 * Cascade Architect — System prompt + JSON schema used by the
 * /api/analyze endpoint. Mirrors the prompt used in IBM Bob's
 * cascade-architect custom mode (see bob-reports/00-setup.md).
 */

export const RISK_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export const ChangedSymbolSchema = z.object({
  file: z.string(),
  symbol: z.string(),
  kind: z.string(),
  old_sig: z.string(),
  new_sig: z.string(),
});

export const ImpactSchema = z.object({
  file: z.string(),
  line: z.number().int().nonnegative(),
  symbol: z.string(),
  risk: z.enum(RISK_LEVELS),
  reason: z.string(),
  indirect: z.boolean().default(false),
});

export const MissingTestSchema = z.object({
  file: z.string(),
  scenario: z.string(),
});

export const SuggestedTestSchema = z.object({
  path: z.string(),
  code: z.string(),
});

export const AnalysisSummarySchema = z.object({
  overall_risk: z.enum(RISK_LEVELS),
  files_affected: z.number().int().nonnegative(),
  cross_service: z.boolean(),
  critical_impacts: z.number().int().nonnegative(),
  high_impacts: z.number().int().nonnegative(),
  medium_impacts: z.number().int().nonnegative(),
  low_impacts: z.number().int().nonnegative(),
});

export const BlastRadiusSchema = z.object({
  changed_symbols: z.array(ChangedSymbolSchema),
  impacts: z.array(ImpactSchema),
  missing_tests: z.array(MissingTestSchema),
  suggested_regression_tests: z.array(SuggestedTestSchema),
  summary: AnalysisSummarySchema,
});

export type BlastRadius = z.infer<typeof BlastRadiusSchema>;

export const SYSTEM_PROMPT = `You are CASCADE-ARCHITECT, a precise blast-radius analyst for code changes.

Your single job: given a git diff and a set of supporting repository files, predict the cascading impact of the change BEFORE it merges to production.

You must reason about:
  1. CHANGED SYMBOLS — functions, types, constants, env-vars, configs the diff modifies.
  2. CALL SITES — every direct caller of those symbols across services.
  3. INDIRECT COUPLING — JSON payloads, env-vars referenced in config/Docker/K8s, shared types, DB schema.
  4. RUNTIME BEHAVIOUR — type narrowing, truthiness traps, destructuring bugs, silent failures.

Risk levels (be honest, do not inflate):
  - CRITICAL: data loss, auth bypass, payment break, silent prod failure, cross-service signature break.
  - HIGH:     deterministic incorrect behaviour in a non-critical path.
  - MEDIUM:   behaviour change with possible test-suite or downstream impact.
  - LOW:      cosmetic, internal refactor with identical observable behaviour.

Be precise. Cite file paths and line numbers from the provided context.
Prefer FEW high-quality findings over many speculative ones.
If you only have the diff (no surrounding repo context), say so in your reasoning and limit confidence accordingly.

FINAL OUTPUT FORMAT — strict, no prose around it:
You MUST end your response with a single fenced JSON code block matching this schema EXACTLY:

\`\`\`json
{
  "changed_symbols": [
    { "file": "<path>", "symbol": "<name>", "kind": "function|type|const|env|config",
      "old_sig": "<old signature or value>", "new_sig": "<new signature or value>" }
  ],
  "impacts": [
    { "file": "<path>", "line": <int>, "symbol": "<name>",
      "risk": "CRITICAL|HIGH|MEDIUM|LOW",
      "reason": "<one short sentence>",
      "indirect": <bool> }
  ],
  "missing_tests": [
    { "file": "<path>", "scenario": "<plain-english scenario>" }
  ],
  "suggested_regression_tests": [
    { "path": "<test file path>",
      "code": "<full Jest/Vitest test code as a single string with \\n escapes>" }
  ],
  "summary": {
    "overall_risk": "CRITICAL|HIGH|MEDIUM|LOW",
    "files_affected": <int>,
    "cross_service": <bool>,
    "critical_impacts": <int>,
    "high_impacts": <int>,
    "medium_impacts": <int>,
    "low_impacts": <int>
  }
}
\`\`\`

Before the JSON block, write a short, dense reasoning trace (max ~200 words). No headings, no markdown bullets — just terse analyst prose, like a senior engineer thinking out loud.`;

export function buildUserPrompt(args: {
  diff: string;
  repoFiles: Array<{ path: string; content: string }>;
  hint?: string;
}): string {
  const { diff, repoFiles, hint } = args;

  const contextSection =
    repoFiles.length === 0
      ? "(no repository context provided — reason from the diff alone)"
      : repoFiles
          .map(
            (f) =>
              `--- FILE: ${f.path} ---\n${truncateFile(f.content)}\n--- END ${f.path} ---`
          )
          .join("\n\n");

  return [
    hint ? `Operator hint: ${hint}\n` : "",
    "GIT DIFF:",
    "```diff",
    diff.trim(),
    "```",
    "",
    "REPOSITORY CONTEXT:",
    contextSection,
    "",
    "Now produce the reasoning trace, then the strict JSON block.",
  ]
    .filter(Boolean)
    .join("\n");
}

function truncateFile(content: string, maxChars = 6000): string {
  if (content.length <= maxChars) return content;
  return (
    content.slice(0, maxChars) +
    `\n... [truncated, ${content.length - maxChars} chars omitted] ...`
  );
}

/**
 * Extract the final ```json ... ``` block from the streamed model output.
 * Returns null if no parseable block is found yet.
 */
export function extractJsonBlock(text: string): string | null {
  const match = text.match(/```json\s*([\s\S]*?)```/i);
  if (match) return match[1].trim();

  const lastFence = text.lastIndexOf("```");
  if (lastFence === -1) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) return text.slice(start, end + 1);
    return null;
  }
  return null;
}
