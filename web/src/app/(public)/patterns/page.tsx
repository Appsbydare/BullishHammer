import type { Metadata } from "next";
import Link from "next/link";
import { getPatterns } from "@/lib/data";
import { GUIDES } from "@/lib/pattern-guides";
import PatternChart from "@/components/PatternChart";
import { DirectionBadge } from "@/components/SignalTable";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Candlestick Patterns Library: 15 Patterns Explained",
  description:
    "Learn the 15 most-used candlestick patterns: hammer, shooting star, engulfing, doji, morning star, harami, tweezers and more, with live examples from the scanner.",
  alternates: { canonical: "/patterns" },
};

export default async function PatternsPage() {
  const patterns = await getPatterns();
  const groups = [
    { title: "Single-candle patterns", items: patterns.filter((p) => p.candles === 1) },
    { title: "Two-candle patterns", items: patterns.filter((p) => p.candles === 2) },
    { title: "Three-candle patterns", items: patterns.filter((p) => p.candles === 3) },
  ];

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Pattern library</p>
        <h1>Candlestick patterns explained</h1>
        <p>
          Each guide covers how the pattern forms, what it tells you about buyers and sellers, how traders use it, and
          the exact rule our scanner applies. Every page lists the pattern&apos;s latest live occurrences.
        </p>
      </div>
      {groups.map((g) => (
        <section key={g.title} className="section-tight">
          <h2>{g.title}</h2>
          <div className="grid grid-3">
            {g.items.map((p) => {
              const guide = GUIDES[p.slug];
              return (
                <Link key={p.slug} href={`/patterns/${p.slug}`} className="card card-link pattern-card">
                  {guide && <PatternChart bars={guide.bars} patternBars={guide.patternBars} width={76} height={56} compact />}
                  <div>
                    <h3>
                      {p.name} <DirectionBadge direction={p.direction} />
                    </h3>
                    <p>{p.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
