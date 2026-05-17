import { notFound } from "next/navigation";
import Link from "next/link";
import { getDemoAnalysis } from "@/lib/demo-data";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import type { RiskLevel } from "@/types/analysis";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: PageProps) {
  const { id } = await params;
  const analysis = getDemoAnalysis(id);
  if (!analysis) notFound();

  const diagram = buildMermaid(analysis);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b hairline pb-3">
        <Link
          href="/demos"
          className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-primary)]"
        >
          ◂ /demos
        </Link>
        <Link
          href={`/analyze?preset=${analysis.id}`}
          className="px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] border border-[color:var(--color-primary)] text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)]"
        >
          ▸ run this diff live
        </Link>
      </div>

      <header className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end border-b hairline-strong pb-6">
        <div>
          <div className="label mb-3">
            /report · {analysis.id} · baked output
          </div>
          <h1 className="font-display text-5xl md:text-6xl italic leading-none">
            {analysis.title}
          </h1>
          <p className="text-sm text-[color:var(--color-muted-foreground)] max-w-xl mt-3 leading-relaxed">
            {analysis.description}
          </p>
        </div>
        <span className={`pill text-base px-4 py-2 risk-${analysis.summary.overall_risk}`}>
          {analysis.summary.overall_risk}
        </span>
      </header>

      <SummaryGrid s={analysis.summary} />

      <Section title="changed symbols" index="/a">
        <div className="border hairline divide-y divide-[color:var(--color-border)]">
          {analysis.changed_symbols.map((sym, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 p-4"
            >
              <div>
                <div className="text-[11px] text-[color:var(--color-muted-foreground)]">
                  {sym.file}
                </div>
                <div className="font-mono mt-1">
                  <span className="text-[color:var(--color-primary)]">
                    {sym.symbol}
                  </span>{" "}
                  <span className="label">{sym.kind}</span>
                </div>
              </div>
              <div className="space-y-1 text-[12px] font-mono">
                <div className="text-[color:var(--color-critical)]">
                  − {sym.old_sig}
                </div>
                <div className="text-[color:var(--color-primary)]">
                  + {sym.new_sig}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="impacts" index="/b">
        <div className="border hairline overflow-x-auto">
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
              {analysis.impacts.map((imp, i) => (
                <tr
                  key={i}
                  className="border-b hairline last:border-b-0 hover:bg-[color:var(--color-surface)]"
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
                  <td className="px-4 py-3 label">
                    {imp.indirect ? "indirect" : "direct"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="dependency graph" index="/c">
        <MermaidDiagram chart={diagram} />
      </Section>

      {analysis.suggested_regression_tests.length > 0 && (
        <Section title="suggested regression tests" index="/d">
          <div className="space-y-3">
            {analysis.suggested_regression_tests.map((t, i) => (
              <div key={i} className="border hairline">
                <div className="flex items-center justify-between px-4 py-2 border-b hairline">
                  <span className="text-[11px] font-mono text-[color:var(--color-muted-foreground)]">
                    {t.path}
                  </span>
                  <span className="label">// jest</span>
                </div>
                <pre className="text-[12px] leading-[1.55] p-4 overflow-x-auto">
                  {t.code}
                </pre>
              </div>
            ))}
          </div>
        </Section>
      )}

      {analysis.missing_tests.length > 0 && (
        <Section title="missing coverage" index="/e">
          <ul className="border hairline divide-y divide-[color:var(--color-border)]">
            {analysis.missing_tests.map((m, i) => (
              <li key={i} className="px-4 py-3 text-sm flex gap-4">
                <span className="font-mono text-[11px] text-[color:var(--color-muted-foreground)] min-w-[22ch]">
                  {m.file}
                </span>
                <span>{m.scenario}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  index,
  children,
}: {
  title: string;
  index: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between border-b hairline pb-2">
        <div className="flex items-baseline gap-4">
          <span className="label">{index}</span>
          <h2 className="font-display text-2xl md:text-3xl italic">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function SummaryGrid({
  s,
}: {
  s: {
    overall_risk: RiskLevel;
    files_affected: number;
    cross_service: boolean;
    critical_impacts: number;
    high_impacts: number;
    medium_impacts: number;
    low_impacts: number;
  };
}) {
  const items: Array<{
    label: string;
    value: string;
    tone?: "critical" | "high" | "medium" | "low";
  }> = [
    { label: "overall", value: s.overall_risk, tone: tone(s.overall_risk) },
    { label: "files", value: String(s.files_affected) },
    { label: "cross-svc", value: s.cross_service ? "yes" : "no" },
    { label: "critical", value: String(s.critical_impacts), tone: "critical" },
    { label: "high", value: String(s.high_impacts), tone: "high" },
    { label: "medium", value: String(s.medium_impacts), tone: "medium" },
    { label: "low", value: String(s.low_impacts), tone: "low" },
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
              it.tone === "critical"
                ? "text-[color:var(--color-critical)]"
                : it.tone === "high"
                  ? "text-[color:var(--color-high)]"
                  : it.tone === "medium"
                    ? "text-[color:var(--color-medium)]"
                    : it.tone === "low"
                      ? "text-[color:var(--color-low)]"
                      : ""
            }`}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function tone(r: RiskLevel): "critical" | "high" | "medium" | "low" {
  if (r === "CRITICAL") return "critical";
  if (r === "HIGH") return "high";
  if (r === "MEDIUM") return "medium";
  return "low";
}

function buildMermaid(a: {
  changed_symbols: { file: string }[];
  impacts: { file: string; risk: RiskLevel; symbol: string }[];
}): string {
  const root = a.changed_symbols[0]?.file ?? "diff";
  const groups = new Map<string, RiskLevel>();
  for (const i of a.impacts) {
    const cur = groups.get(i.file) ?? "LOW";
    groups.set(i.file, worse(cur, i.risk));
  }

  let g = "graph LR\n";
  g += `  ROOT["${root}"]:::changed\n`;
  let n = 0;
  for (const [file, risk] of groups) {
    const id = `N${n++}`;
    g += `  ROOT --> ${id}["${file}"]:::${risk.toLowerCase()}\n`;
  }
  g += `\n  classDef changed fill:#c6ff00,stroke:#c6ff00,color:#0a0c0b,font-weight:bold\n`;
  g += `  classDef critical fill:#1a0805,stroke:#ff5b1f,color:#ff5b1f\n`;
  g += `  classDef high fill:#1a1305,stroke:#ffb020,color:#ffb020\n`;
  g += `  classDef medium fill:#05151a,stroke:#4cc9f0,color:#4cc9f0\n`;
  g += `  classDef low fill:#0c1610,stroke:#84a98c,color:#84a98c\n`;
  return g;
}

function worse(a: RiskLevel, b: RiskLevel): RiskLevel {
  const o: Record<RiskLevel, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return o[a] >= o[b] ? a : b;
}
