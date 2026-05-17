"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        background: "#0a0c0b",
        primaryColor: "#161b19",
        primaryTextColor: "#e9ece8",
        primaryBorderColor: "#c6ff00",
        lineColor: "#3a413c",
        secondaryColor: "#101413",
        tertiaryColor: "#161b19",
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: "12px",
      },
      securityLevel: "loose",
    });
  }, []);

  useEffect(() => {
    const render = async () => {
      if (!containerRef.current) return;
      try {
        setError(null);
        const { svg } = await mermaid.render(
          `m-${Math.random().toString(36).slice(2, 11)}`,
          chart
        );
        containerRef.current.innerHTML = svg;
      } catch (e) {
        console.error(e);
        setError("Failed to render diagram");
      }
    };
    render();
  }, [chart]);

  return (
    <div
      className={`border hairline p-4 overflow-auto bg-[color:var(--color-surface)] ${className ?? ""}`}
    >
      {error ? (
        <p className="text-[color:var(--color-critical)] text-sm">{error}</p>
      ) : (
        <div ref={containerRef} className="flex justify-center" />
      )}
    </div>
  );
}
