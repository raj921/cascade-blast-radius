import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="border hairline-strong bracket-frame relative p-12 max-w-lg w-full bg-[color:var(--color-surface)]">
        <span className="bl" />
        <span className="br" />
        <div className="label mb-3">// error · 404</div>
        <h1 className="font-display text-6xl italic leading-none">
          Off-graph.
        </h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)] mt-4 leading-relaxed">
          The route you traced has no callers in this build. Head back to the
          observatory.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block px-5 py-2 bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] text-xs uppercase tracking-[0.22em] font-bold"
        >
          ▸ /index
        </Link>
      </div>
    </div>
  );
}
