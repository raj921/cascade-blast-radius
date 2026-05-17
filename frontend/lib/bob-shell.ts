import { spawn, spawnSync } from "node:child_process";

/**
 * IBM Bob Shell — non-interactive invocation for /api/analyze.
 * @see https://bob.ibm.com/docs/shell/getting-started/install-and-setup
 * @see https://bob.ibm.com/docs/shell/getting-started/start-bobshell-non-interactive
 */

export const CASCADE_BOB_ENGINE = "IBM Bob Shell";

const BOB_STDIN_PROMPT =
  "The CASCADE-ARCHITECT system specification and user task are on stdin (UTF-8). Read all of stdin first, then follow it exactly: terse reasoning trace, then one fenced json code block as specified at the end.";

export function hasBobShellApiKey(): boolean {
  return !!process.env.BOBSHELL_API_KEY?.trim();
}

/**
 * Returns true if the `bob` executable appears to be on PATH.
 */
export function bobBinaryAvailable(): boolean {
  try {
    const r = spawnSync("bob", ["--help"], {
      timeout: 12_000,
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (r.error) {
      const code = (r.error as NodeJS.ErrnoException).code;
      return code !== "ENOENT";
    }
    return true;
  } catch {
    return false;
  }
}

export function isBobShellReady(): boolean {
  return hasBobShellApiKey() && bobBinaryAvailable();
}

export interface BobShellResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export interface BobShellStreamHandlers {
  onStdoutChunk: (chunk: string) => void;
  onStderrChunk: (chunk: string) => void;
}

/**
 * Runs `bob --auth-method api-key` with the full CASCADE prompt on stdin.
 * Streams stdout/stderr chunks to handlers for SSE trace updates.
 */
export function runBobShellStreaming(
  stdinBody: string,
  handlers: BobShellStreamHandlers,
  timeoutMs = 900_000
): Promise<BobShellResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "bob",
      ["--auth-method", "api-key", "-p", BOB_STDIN_PROMPT],
      {
        env: { ...process.env },
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeoutRef: { id: ReturnType<typeof setTimeout> | null } = {
      id: null,
    };

    const finishErr = (err: Error) => {
      if (settled) return;
      settled = true;
      if (timeoutRef.id !== null) clearTimeout(timeoutRef.id);
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      reject(err);
    };

    const finishOk = (code: number | null) => {
      if (settled) return;
      settled = true;
      if (timeoutRef.id !== null) clearTimeout(timeoutRef.id);
      resolve({ stdout, stderr, exitCode: code });
    };

    timeoutRef.id = setTimeout(() => {
      finishErr(new Error(`Bob Shell timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");

    child.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
      handlers.onStdoutChunk(chunk);
    });
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
      handlers.onStderrChunk(chunk);
    });

    child.on("error", (err) => {
      finishErr(err instanceof Error ? err : new Error(String(err)));
    });

    child.on("close", (code) => {
      finishOk(code);
    });

    const stdin = child.stdin;
    if (!stdin) {
      finishErr(new Error("Bob Shell stdin is not available"));
      return;
    }
    stdin.write(stdinBody, "utf8", (err) => {
      if (err) {
        finishErr(err);
        return;
      }
      stdin.end();
    });
  });
}
