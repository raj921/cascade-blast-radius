/**
 * Minimal unified-diff parser. We extract the files touched and a few
 * symbol candidates so the UI can show *something* before the LLM responds.
 * The LLM does the real analysis — this is purely for UX latency hiding.
 */

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  hunks: number;
  candidateSymbols: string[];
}

const SYMBOL_RE =
  /\b(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;

const ENV_RE = /process\.env\.([A-Z0-9_]+)/g;

export function parseUnifiedDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diff.split("\n");

  let current: DiffFile | null = null;
  const symbolsByFile = new Map<string, Set<string>>();

  for (const line of lines) {
    const fileMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (fileMatch) {
      if (current) files.push(current);
      const path = fileMatch[2];
      current = {
        path,
        additions: 0,
        deletions: 0,
        hunks: 0,
        candidateSymbols: [],
      };
      symbolsByFile.set(path, new Set());
      continue;
    }

    if (!current) continue;

    if (line.startsWith("@@")) {
      current.hunks++;
      continue;
    }

    if (line.startsWith("+++ ") || line.startsWith("--- ")) continue;

    if (line.startsWith("+") && !line.startsWith("++")) {
      current.additions++;
      collectSymbols(line.slice(1), symbolsByFile.get(current.path)!);
      continue;
    }

    if (line.startsWith("-") && !line.startsWith("--")) {
      current.deletions++;
      collectSymbols(line.slice(1), symbolsByFile.get(current.path)!);
      continue;
    }
  }

  if (current) files.push(current);

  for (const f of files) {
    f.candidateSymbols = Array.from(symbolsByFile.get(f.path) ?? []);
  }

  return files;
}

function collectSymbols(line: string, sink: Set<string>) {
  for (const m of line.matchAll(SYMBOL_RE)) sink.add(m[1]);
  for (const m of line.matchAll(ENV_RE)) sink.add(`process.env.${m[1]}`);
}

export function summariseDiff(diff: string): {
  files: DiffFile[];
  totalAdditions: number;
  totalDeletions: number;
} {
  const files = parseUnifiedDiff(diff);
  return {
    files,
    totalAdditions: files.reduce((s, f) => s + f.additions, 0),
    totalDeletions: files.reduce((s, f) => s + f.deletions, 0),
  };
}
