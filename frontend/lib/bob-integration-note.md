# Bob Integration

## Current implementation

The Cascade frontend invokes **IBM Bob Shell** directly on the Next.js server:

- **Binary**: `bob` on `PATH` (install from [Bob Shell — Installing](https://bob.ibm.com/docs/shell/getting-started/install-and-setup)).
- **Auth**: non-interactive API key — `BOBSHELL_API_KEY` (Inference-scoped key from the Bob web portal).
- **Invocation**: `bob --auth-method api-key -p "<short meta-instruction>"` with the full CASCADE-ARCHITECT system prompt plus user task (diff + repository file excerpts) on **stdin** UTF-8.
- **Output**: stdout/stderr are streamed to the browser over SSE; the route extracts the final fenced `json` code block and validates it with Zod (`BlastRadiusSchema` in `lib/cascade-prompt.ts`).

This matches IBM’s documented pattern for scripting: pipe or stdin a large
prompt, use `-p` for the short instruction line ([Starting a non-interactive session](https://bob.ibm.com/docs/shell/getting-started/start-bobshell-non-interactive)).

## Flow

```
User → Next.js UI → POST /api/analyze
       → Bob Shell (bob CLI, cwd = Next server)
       → SSE (trace = stdout, reasoning = stderr)
       → extractJsonBlock + Zod → impact report UI
```

Optional GitHub PR data is still fetched via `POST /api/github` (unchanged);
the client can pass returned `diff` and `files` into `/api/analyze` when wired
in the UI.

## Why `bob-reports/` still matters

The `bob-reports/` directory contains **real outputs from IBM Bob** (IDE /
custom mode) analyzing the demo monorepo — architecture, import graph, three
demo narratives, Mermaid graphs, etc. The web app reuses the **same**
`cascade-architect` prompt contract so results stay aligned with those reports.

## First-time setup

1. Install Bob Shell; verify `bob --help`.
2. Accept the license once if prompted: `bob --accept-license -p "ok"`.
3. Create an Inference API key in the Bob portal; set `BOBSHELL_API_KEY` in
   `frontend/.env.local`.
4. Optional: tune `BOB_SHELL_TIMEOUT_MS` for very large repos.

## Verification

1. `GET /api/analyze` — should report `bobReady: true` when key + CLI are OK.
2. Run preset **demo-1** on `/analyze` — expect a validated JSON report.
3. Compare tone and structure to `bob-reports/03-demo-auth-change.md`.

---

**Bottom line**: Live analysis uses **Bob Shell** on the machine that runs
Node.js. Baked demos and `bob-reports/` document the same blast-radius
methodology for judges and readers.
