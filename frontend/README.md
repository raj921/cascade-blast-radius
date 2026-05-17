# Cascade — Blast Radius Observatory

The frontend for [Cascade](../README.md). A live UI for the `cascade-architect`
agent, built for the **IBM Bob Hackathon 2026**.

The `/analyze` page calls **IBM Bob Shell** on the server (non-interactive,
`bob --auth-method api-key`), streams stdout/stderr over Server-Sent Events,
and validates the final fenced JSON against a strict Zod schema before it
hits the impact table.

## Stack

- **Next.js 16** (App Router, RSC, route handlers)
- **React 19**, **TypeScript** strict
- **Tailwind CSS v4** with a custom Industrial Observatory theme
  (JetBrains Mono + Instrument Serif, acid lime + slate, hairline borders)
- **IBM Bob Shell** (`bob` CLI) — see [Bob install](https://bob.ibm.com/docs/shell/getting-started/install-and-setup) and [non-interactive mode](https://bob.ibm.com/docs/shell/getting-started/start-bobshell-non-interactive)
- **Zod** for runtime validation of Bob output
- **Mermaid** for the dependency graph

## Quickstart

```bash
cd cascade-blast-radius/frontend
npm install
cp .env.example .env.local        # then set BOBSHELL_API_KEY (Bob portal, Inference key)
# Install Bob Shell so `bob --help` works in this environment
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Hit `02 · Analyze`,
click any preset, watch Bob Shell run.

First time on a machine you may need to accept the Bob license once:

```bash
bob --accept-license -p "ok"
```

## Environment

Required for live `/analyze`:

| Variable | Notes |
| --- | --- |
| `BOBSHELL_API_KEY` | Inference-scoped API key from the Bob web portal ([API keys](https://bob.ibm.com/docs/ide/account/api-keys)) |

Optional:

| Variable | Default | Purpose |
| --- | --- | --- |
| `BOB_SHELL_TIMEOUT_MS` | `900000` | Max wall time for one Bob invocation (ms) |

If `BOBSHELL_API_KEY` is missing or `bob` is not on `PATH`, the UI still works
for inspection but shows a configuration banner. Baked `/analysis/[id]`
reports do not need Bob.

## API

The streaming endpoint:

```http
POST /api/analyze
Content-Type: application/json

{
  "diff":   "...unified diff text...",   // OR
  "preset": "demo-1" | "demo-2" | "demo-3",
  "hint":   "optional analyst hint",
  "files":  [ { "path": "src/foo.ts", "content": "..." } ]
}
```

Returns `text/event-stream` with the following events:

| event | payload | meaning |
| --- | --- | --- |
| `status` | `{ phase, message }` | pipeline phase change |
| `diff_summary` | `{ files, totalAdditions, totalDeletions, engine, preset }` | parsed-diff snapshot |
| `reasoning` | `{ text }` | stderr chunks from Bob Shell |
| `trace` | `{ text }` | stdout chunks from Bob Shell |
| `partial_json` | `{ text }` | the JSON block once ` ```json ` is present |
| `final` | `{ analysis, elapsed_ms }` | validated `BlastRadiusAnalysis` |
| `done` | `{ elapsed_ms }` | terminal |
| `error` | `{ code, message, raw?, issues? }` | terminal failure |

`GET /api/analyze` returns `engine`, `bobReady`, `hasBobShellApiKey`,
`bobBinaryAvailable`, and preset ids.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Hero, stats, pipeline overview |
| `/demos` | The three reference scenarios with baked + live links |
| `/analysis/[id]` | Baked report for a preset (no Bob needed) |
| `/analyze` | The observatory — paste a diff or fire a preset |
| `/analyze?preset=demo-1` | Auto-fires the preset on mount |

## How the demos call real code

Each preset in `lib/repo-context.ts` declares a diff plus a list of files
from `../demo-monorepo/`. The API route reads those files server-side and
feeds them to Bob on stdin as context, so the agent traces through real
cross-service code.

## Layout

```
frontend/
├── app/
│   ├── layout.tsx              telemetry header + footer
│   ├── page.tsx                home / hero
│   ├── globals.css             Industrial Observatory design system
│   ├── analyze/
│   │   ├── page.tsx            RSC entrypoint
│   │   └── analyze-client.tsx  SSE consumer, live UI
│   ├── analysis/[id]/page.tsx  baked report
│   ├── demos/page.tsx          scenarios index
│   ├── not-found.tsx           "off-graph" 404
│   └── api/analyze/route.ts    POST → SSE (Bob Shell)
├── lib/
│   ├── bob-shell.ts            spawn `bob`, readiness helpers
│   ├── cascade-prompt.ts     system prompt + Zod schema
│   ├── diff-parser.ts          unified-diff → symbol candidates
│   ├── repo-context.ts         fs reader + preset definitions
│   ├── demo-data.ts            baked JSON loader
│   └── utils.ts                cn()
├── components/
│   ├── mermaid-diagram.tsx     dark Mermaid renderer
│   └── ui/                     (legacy shadcn — unused by new pages)
└── types/analysis.ts
```

## Production build

```bash
npm run build
npm start
```

The streaming route uses `runtime = "nodejs"` because it reads from the local
filesystem for preset context and spawns the `bob` CLI. Deploy only to
environments where Bob Shell is installed and authenticated (same host as
Node).

## License

MIT — see [LICENSE](../LICENSE).
