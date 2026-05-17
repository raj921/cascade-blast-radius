import Link from "next/link";
import { getAllDemoAnalyses } from "@/lib/demo-data";

export default function DemosPage() {
  const demos = getAllDemoAnalyses();
  return (
    <div className="space-y-10">
      <header className="border-b hairline-strong pb-6">
        <div className="label mb-3">/01 · reference scenarios</div>
        <h1 className="font-display text-5xl md:text-6xl italic leading-none">
          Three changes,{" "}
          <span className="text-[color:var(--color-muted-foreground)]">
            three verdicts.
          </span>
        </h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-2xl mt-4 leading-relaxed">
          Each scenario is wired to the live agent. Open one to inspect the
          baked-in analysis — or run the same diff through the live cascade
          agent and watch it stream a second opinion.
        </p>
      </header>

      <div className="space-y-px bg-[color:var(--color-border)]">
        {demos.map((d, i) => (
          <DemoCard key={d.id} demo={d} idx={i} />
        ))}
      </div>

      <section className="border hairline p-8 bg-[color:var(--color-surface)]">
        <div className="label mb-3">// why these three</div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[12px] leading-relaxed text-[color:var(--color-muted-foreground)]">
          <li>
            <span className="text-[color:var(--color-foreground)] font-display italic text-base">
              01 — Cross-service signature.
            </span>{" "}
            Proves Cascade traces past package boundaries that snippet AIs
            never reach.
          </li>
          <li>
            <span className="text-[color:var(--color-foreground)] font-display italic text-base">
              02 — Runtime config drift.
            </span>{" "}
            Proves the agent reads .env, docker-compose, and K8s — not just
            .ts files.
          </li>
          <li>
            <span className="text-[color:var(--color-foreground)] font-display italic text-base">
              03 — Safe refactor.
            </span>{" "}
            Proves restraint: no false-positive CRITICALs for behaviour-equal
            changes.
          </li>
        </ul>
      </section>
    </div>
  );
}

function DemoCard({
  demo,
  idx,
}: {
  demo: ReturnType<typeof getAllDemoAnalyses>[number];
  idx: number;
}) {
  return (
    <article className="bg-[color:var(--color-background)] grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 p-8 hover:bg-[color:var(--color-surface)] transition-colors">
      <div className="space-y-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="label">demo {String(idx + 1).padStart(2, "0")}</div>
            <h2 className="font-display text-4xl italic mt-1">{demo.title}</h2>
          </div>
          <span className={`pill risk-${demo.summary.overall_risk}`}>
            {demo.summary.overall_risk}
          </span>
        </div>
        <p className="text-sm text-[color:var(--color-muted-foreground)] leading-relaxed max-w-xl">
          {demo.description}
        </p>

        <div className="space-y-2">
          <div className="label">// changed symbols</div>
          {demo.changed_symbols.map((s, i) => (
            <div
              key={i}
              className="text-[12px] font-mono flex items-center justify-between gap-4 border hairline px-3 py-2"
            >
              <span className="text-[color:var(--color-primary)]">
                {s.symbol}
              </span>
              <span className="text-[color:var(--color-muted-foreground)] text-[10px] uppercase tracking-[0.16em]">
                {s.kind}
              </span>
              <span className="text-[10px] text-[color:var(--color-muted-foreground)] truncate">
                {s.file}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href={`/analysis/${demo.id}`}
            className="px-4 py-2 border border-[color:var(--color-border-strong)] text-xs uppercase tracking-[0.2em] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
          >
            ▾ baked report
          </Link>
          <Link
            href={`/analyze?preset=${demo.id}`}
            className="px-4 py-2 bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] text-xs uppercase tracking-[0.2em] font-bold"
          >
            ▸ run live
          </Link>
        </div>
      </div>

      <div className="border hairline bg-[color:var(--color-background)]">
        <div className="px-4 py-2 border-b hairline label">
          // top impacts ({demo.impacts.length})
        </div>
        <ul className="divide-y divide-[color:var(--color-border)]">
          {demo.impacts.slice(0, 4).map((imp, i) => (
            <li key={i} className="px-4 py-3 flex items-start gap-3">
              <span className={`pill risk-${imp.risk} mt-0.5 shrink-0`}>
                {imp.risk}
              </span>
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-[color:var(--color-foreground)] truncate">
                  {imp.file}
                  <span className="text-[color:var(--color-muted-foreground)]">
                    :{imp.line}
                  </span>
                </div>
                <div className="text-[11px] text-[color:var(--color-muted-foreground)] mt-0.5 leading-relaxed">
                  {imp.reason}
                </div>
              </div>
            </li>
          ))}
          {demo.impacts.length > 4 && (
            <li className="px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
              +{demo.impacts.length - 4} more
            </li>
          )}
        </ul>
        <div className="grid grid-cols-3 border-t hairline text-[11px] num">
          <Stat n={demo.summary.files_affected} l="files" />
          <Stat
            n={demo.summary.critical_impacts}
            l="critical"
            tone="critical"
          />
          <Stat n={demo.missing_tests.length} l="gaps" />
        </div>
      </div>
    </article>
  );
}

function Stat({
  n,
  l,
  tone,
}: {
  n: number;
  l: string;
  tone?: "critical";
}) {
  return (
    <div className="p-3 border-r last:border-r-0 hairline">
      <div className="label mb-1">{l}</div>
      <div
        className={`text-xl ${
          tone === "critical" ? "text-[color:var(--color-critical)]" : ""
        }`}
      >
        {n}
      </div>
    </div>
  );
}
