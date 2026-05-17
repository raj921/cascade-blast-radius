import type { Metadata } from "next";
import { JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { CASCADE_BOB_ENGINE } from "@/lib/bob-shell";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbm",
  display: "swap",
});

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cascade // Blast Radius Observatory",
  description:
    "Live blast-radius analysis for code changes. Powered by IBM Bob Shell (non-interactive).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${mono.variable} ${serif.variable}`}>
      <body className="min-h-screen flex flex-col">
        <TelemetryBar />
        <TopNav />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-10 py-10">
          {children}
        </main>
        <FooterBar />
      </body>
    </html>
  );
}

function TelemetryBar() {
  return (
    <div className="border-b hairline bg-[color:var(--color-surface)]/40 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-8 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)] num">
        <div className="flex items-center gap-5">
          <span className="pill pill-live">Live</span>
          <span>
            Node ·{" "}
            <span className="text-[color:var(--color-foreground)]">
              cascade-architect
            </span>
          </span>
          <span className="hidden md:inline">
            Engine ·{" "}
            <span className="text-[color:var(--color-foreground)]">
              {CASCADE_BOB_ENGINE}
            </span>
          </span>
          <span className="hidden lg:inline">
            Region · <span className="text-[color:var(--color-foreground)]">edge</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden md:inline">v0.9.0-hackathon</span>
          <span>
            <ClockTick />
          </span>
        </div>
      </div>
    </div>
  );
}

function ClockTick() {
  return (
    <span suppressHydrationWarning>
      {new Date()
        .toISOString()
        .replace("T", " · ")
        .slice(0, 19)}
      Z
    </span>
  );
}

function TopNav() {
  return (
    <header className="border-b hairline">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Logo />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
              IBM Bob · Hackathon 2026
            </span>
            <span className="font-display italic text-2xl mt-0.5">
              Cascade
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-[12px] uppercase tracking-[0.18em]">
          <NavLink href="/" label="00 · Index" />
          <NavLink href="/demos" label="01 · Demos" />
          <NavLink href="/analyze" label="02 · Analyze" highlight />
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  highlight,
}: {
  href: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 hover:text-[color:var(--color-primary)] transition-colors ${
        highlight
          ? "text-[color:var(--color-primary)] border border-[color:var(--color-primary)]/30 hover:border-[color:var(--color-primary)]"
          : "text-[color:var(--color-muted-foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}

function Logo() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      className="text-[color:var(--color-primary)]"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="32"
        height="32"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="9" cy="9" r="2.5" fill="currentColor" />
      <circle cx="25" cy="9" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="9" cy="25" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="25" cy="25" r="2.5" fill="currentColor" opacity="0.2" />
      <line x1="9" y1="9" x2="25" y2="9" stroke="currentColor" strokeWidth="1" />
      <line x1="9" y1="9" x2="9" y2="25" stroke="currentColor" strokeWidth="1" />
      <line
        x1="9"
        y1="9"
        x2="25"
        y2="25"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function FooterBar() {
  return (
    <footer className="border-t hairline mt-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] text-[color:var(--color-muted-foreground)] uppercase tracking-[0.16em]">
        <div>
          <div className="label mb-1">{"// stack"}</div>
          Next.js 16 · IBM Bob Shell · cascade-architect
        </div>
        <div>
          <div className="label mb-1">{"// repository"}</div>
          <a
            className="hover:text-[color:var(--color-primary)]"
            href="https://github.com/raj921/cascade-blast-radius"
            target="_blank"
            rel="noreferrer"
          >
            github.com/raj921/cascade-blast-radius ↗
          </a>
        </div>
        <div className="md:text-right">
          <div className="label mb-1">{"// status"}</div>
          <span className="text-[color:var(--color-primary)]">●</span> ready ·
          MIT
        </div>
      </div>
    </footer>
  );
}
