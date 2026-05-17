import Link from "next/link";
import { getAllDemoAnalyses } from "@/lib/demo-data";
import { CASCADE_BOB_ENGINE, isBobShellReady } from "@/lib/bob-shell";

export default function Home() {
  const demos = getAllDemoAnalyses();
  const totalImpacts = demos.reduce((s, d) => s + d.impacts.length, 0);
  const critical = demos.reduce((s, d) => s + d.summary.critical_impacts, 0);
  const files = demos.reduce((s, d) => s + d.summary.files_affected, 0);
  const live = isBobShellReady();

  return (
    <div className="space-y-20">
      {/* ── HERO ── */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10 items-end pt-4">
        <div>
          <div className="label mb-4">/00 · cascade — blast radius observatory</div>
          <h1 className="font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.92] tracking-[-0.02em]">
            Predict the <span className="italic text-[color:var(--color-primary)]">blast radius</span>
            <br />
            before the merge.
          </h1>
          <p className="mt-8 max-w-2xl text-sm leading-[1.7] text-[color:var(--color-muted-foreground)]">
            Most AI coding tools see snippets. Cascade reads the entire
            repository, traces every cross-service call, follows env-vars into
            Docker, K8s, CI — and tells you exactly which lines will burn when
            your diff merges. Live analysis runs on **IBM Bob Shell**
            (non-interactive, full CASCADE-ARCHITECT prompt on the server).
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/analyze"
              className="px-6 py-3 bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] text-xs uppercase tracking-[0.22em] font-bold glow-lime hover:opacity-90"
            >
              ▸ run live analysis
            </Link>
            <Link
              href="/demos"
              className="px-6 py-3 border border-[color:var(--color-border-strong)] text-xs uppercase tracking-[0.22em] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
            >
              ▾ inspect demos
            </Link>
          </div>
        </div>

        <SystemPanel live={live} />
      </section>

      {/* ── STATS STRIP ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 border hairline-strong">
        <Stat label="demos analyzed" value={demos.length.toString()} />
        <Stat label="impacts detected" value={totalImpacts.toString()} />
        <Stat label="critical" value={critical.toString()} tone="critical" />
        <Stat label="files traced" value={files.toString()} />
      </section>

      {/* ── PILLARS ── */}
      <section className="space-y-8">
        <SectionHeading index="/01" title="What snippet AIs miss" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[color:var(--color-border)]">
          <Pillar
            num="01"
            title="Cross-service breaks"
            body="A signature change in `services/auth` silently rewires four callers in `services/billing`. The compiler shrugs. Cascade catches it."
          />
          <Pillar
            num="02"
            title="Silent runtime failures"
            body="`SMTP_SERVER` → `MAIL_HOST` in code, but .env / docker-compose / K8s manifest disagree. No type checker sees this. Cascade does."
          />
          <Pillar
            num="03"
            title="No false positives"
            body="Refactor `calculateTax` with identical contract? Cascade flags it MEDIUM, not CRITICAL. Trust depends on restraint."
          />
        </div>
      </section>

      {/* ── DEMO ROLODEX ── */}
      <section className="space-y-6">
        <SectionHeading index="/02" title="Reference scenarios" />
        <div className="space-y-px bg-[color:var(--color-border)]">
          {demos.map((d, i) => (
            <DemoRow key={d.id} demo={d} idx={i} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="space-y-8">
        <SectionHeading index="/03" title="Pipeline" />
        <div className="border hairline-strong p-8 bracket-frame relative bg-[color:var(--color-surface)]">
          <span className="bl" />
          <span className="br" />
          <ol className="grid grid-cols-1 md:grid-cols-5 gap-6 text-sm">
            {[
              ["parse", "unified diff → changed-symbol candidates"],
              ["context", "load cross-service source files"],
              ["analyze", "invoke IBM Bob Shell with cascade-architect"],
              ["classify", "CRITICAL · HIGH · MEDIUM · LOW"],
              ["emit", "JSON · Mermaid · Jest tests · PR comment"],
            ].map(([k, v], i) => (
              <li key={k} className="space-y-2">
                <div className="text-[color:var(--color-primary)] num text-2xl">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="label">{k}</div>
                <div className="text-[color:var(--color-muted-foreground)] text-[12px] leading-relaxed">
                  {v}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border hairline-strong p-10 md:p-14 bracket-frame relative">
        <span className="bl" />
        <span className="br" />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="label mb-2">/04 · try it</div>
            <h3 className="font-display text-4xl md:text-5xl italic">
              Watch the agent think — live.
            </h3>
            <p className="text-[color:var(--color-muted-foreground)] text-sm max-w-xl mt-2">
              Run a preset and watch Bob Shell return the reasoning trace and
              strict JSON impact report. Engine · {CASCADE_BOB_ENGINE}.
            </p>
          </div>
          <Link
            href="/analyze"
            className="px-6 py-3 bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] text-xs uppercase tracking-[0.22em] font-bold glow-lime whitespace-nowrap"
          >
            ▸ open observatory
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── pieces ── */

function SystemPanel({ live }: { live: boolean }) {
  return (
    <aside className="border hairline-strong bracket-frame relative bg-[color:var(--color-surface)] p-6 text-[12px] num">
      <span className="bl" />
      <span className="br" />
      <div className="label mb-3">{"// system"}</div>
      <ul className="space-y-2 text-[color:var(--color-muted-foreground)]">
        <Row k="engine" v={CASCADE_BOB_ENGINE} />
        <Row k="transport" v="server-sent events" />
        <Row k="agent" v="cascade-architect" />
        <Row
          k="status"
          v={
            <span
              className={
                live
                  ? "text-[color:var(--color-primary)]"
                  : "text-[color:var(--color-high)]"
              }
            >
              ● {live ? "online" : "bob/key missing"}
            </span>
          }
        />
        <Row k="license" v="MIT" />
      </ul>
      <div className="mt-6 pt-4 border-t hairline label">
        {"// commissioned for IBM Bob — 2026"}
      </div>
    </aside>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <span className="text-[10px] uppercase tracking-[0.18em]">{k}</span>
      <span className="text-[color:var(--color-foreground)] truncate text-right">
        {v}
      </span>
    </li>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "critical";
}) {
  return (
    <div className="p-6 md:p-8 border-r last:border-r-0 hairline">
      <div className="label mb-3">{label}</div>
      <div
        className={`font-display text-6xl md:text-7xl num leading-none ${
          tone === "critical" ? "text-[color:var(--color-critical)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-end justify-between border-b hairline-strong pb-3">
      <div className="flex items-baseline gap-5">
        <span className="label">{index}</span>
        <h2 className="font-display text-3xl md:text-4xl italic">{title}</h2>
      </div>
      <span className="label hidden md:inline">▮▮▮▮▮▮</span>
    </div>
  );
}

function Pillar({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="bg-[color:var(--color-background)] p-8">
      <div className="flex items-baseline justify-between mb-4">
        <span className="num text-[color:var(--color-primary)] text-2xl">{num}</span>
        <span className="label">·</span>
      </div>
      <h3 className="font-display text-2xl italic mb-3">{title}</h3>
      <p className="text-[12px] text-[color:var(--color-muted-foreground)] leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function DemoRow({
  demo,
  idx,
}: {
  demo: ReturnType<typeof getAllDemoAnalyses>[number];
  idx: number;
}) {
  return (
    <Link
      href={`/analysis/${demo.id}`}
      className="grid grid-cols-12 gap-4 bg-[color:var(--color-background)] hover:bg-[color:var(--color-surface)] px-6 py-5 items-center group"
    >
      <div className="col-span-1 num text-[color:var(--color-muted-foreground)]">
        {String(idx + 1).padStart(2, "0")}
      </div>
      <div className="col-span-12 md:col-span-6">
        <div className="font-display text-2xl italic group-hover:text-[color:var(--color-primary)] transition-colors">
          {demo.title}
        </div>
        <div className="text-[11px] text-[color:var(--color-muted-foreground)] mt-1 leading-relaxed">
          {demo.description}
        </div>
      </div>
      <div className="col-span-6 md:col-span-2 num text-sm">
        <div className="label mb-1">impacts</div>
        <div>{demo.impacts.length}</div>
      </div>
      <div className="col-span-6 md:col-span-2 num text-sm">
        <div className="label mb-1">files</div>
        <div>{demo.summary.files_affected}</div>
      </div>
      <div className="col-span-12 md:col-span-1 text-right">
        <span className={`pill risk-${demo.summary.overall_risk}`}>
          {demo.summary.overall_risk}
        </span>
      </div>
    </Link>
  );
}
