"use client";

import { useEffect, useRef, useState } from "react";
import type { FxSnapshot, FxQuote } from "@/lib/fx";

/** Builds an SVG path from normalised 0-100 points. */
function sparkPath(points: number[], width = 100, height = 32): string {
  if (points.length < 2) return "";
  const step = width / (points.length - 1);
  return points
    .map((p, i) => {
      const x = i * step;
      // Invert Y: SVG origin is top-left, but higher rate should sit higher.
      const y = height - (p / 100) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatRate(rate: number, decimals: number): string {
  return Number.isFinite(rate) ? rate.toFixed(decimals) : "—";
}

function Row({ quote, flash }: { quote: FxQuote; flash: "up" | "down" | null }) {
  const dir = quote.changePct === null ? "flat" : quote.changePct >= 0 ? "up" : "down";
  const path = sparkPath(quote.spark);

  return (
    <li className={`fx-row fx-dir-${dir}${flash ? ` fx-flash-${flash}` : ""}`}>
      <div className="fx-row-head">
        <span className="fx-pair">{quote.label}</span>
        <span className="fx-rate-value">{formatRate(quote.rate, quote.decimals)}</span>
      </div>

      <div className="fx-row-foot">
        <svg
          className="fx-spark"
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          {path && (
            <>
              <path className="fx-spark-fill" d={`${path} L100,32 L0,32 Z`} />
              <path className="fx-spark-line" d={path} vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>

        {quote.changePct === null ? (
          <span className="fx-delta fx-delta-flat">—</span>
        ) : (
          <span className={`fx-delta fx-delta-${dir}`}>
            <svg viewBox="0 0 12 12" aria-hidden="true" className="fx-delta-arrow">
              <path d="M6 2.5 L10 8 L2 8 Z" />
            </svg>
            {Math.abs(quote.changePct).toFixed(2)}%
          </span>
        )}
      </div>

      <span className="fx-sr-only">
        {quote.label} at {formatRate(quote.rate, quote.decimals)},{" "}
        {quote.changePct === null
          ? "change unavailable"
          : `${dir === "up" ? "up" : "down"} ${Math.abs(quote.changePct).toFixed(2)} percent over 30 days`}
      </span>
    </li>
  );
}

export default function FxRates({ initial }: { initial: FxSnapshot }) {
  const [snapshot, setSnapshot] = useState<FxSnapshot>(initial);
  const [flashes, setFlashes] = useState<Record<string, "up" | "down">>({});
  const [refreshing, setRefreshing] = useState(false);
  const prevRates = useRef<Record<string, number>>(
    Object.fromEntries(initial.quotes.map((q) => [q.code, q.rate]))
  );

  useEffect(() => {
    let cancelled = false;
    // Rates are cached upstream for 1h; polling every 60s keeps the widget
    // feeling live without burning the free-tier request budget.
    const POLL_MS = 60_000;

    async function refresh() {
      if (document.hidden) return; // don't poll a backgrounded tab
      setRefreshing(true);
      try {
        const res = await fetch("/api/fx");
        if (!res.ok) return;
        const next: FxSnapshot = await res.json();
        if (cancelled) return;

        // Flash any row whose rate moved since the last poll.
        const moved: Record<string, "up" | "down"> = {};
        for (const q of next.quotes) {
          const before = prevRates.current[q.code];
          if (before !== undefined && Number.isFinite(q.rate) && q.rate !== before) {
            moved[q.code] = q.rate > before ? "up" : "down";
          }
          prevRates.current[q.code] = q.rate;
        }

        setSnapshot(next);
        if (Object.keys(moved).length > 0) {
          setFlashes(moved);
          setTimeout(() => !cancelled && setFlashes({}), 1200);
        }
      } catch {
        // Network hiccup — keep showing the last good snapshot.
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    const id = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="fx-widget" aria-label="Live foreign exchange rates">
      <header className="fx-widget-head">
        <div className="fx-title-group">
          <h3 className="fx-title">Live FX Rates</h3>
          <p className="fx-subtitle">30-day trend · spot mid-market</p>
        </div>
        <span
          className={`fx-status${snapshot.stale ? " is-stale" : ""}${refreshing ? " is-syncing" : ""}`}
          title={snapshot.stale ? "Showing indicative rates" : "Live data"}
        >
          <span className="fx-status-dot" aria-hidden="true" />
          {snapshot.stale ? "Indicative" : "Live"}
        </span>
      </header>

      <ul className="fx-list">
        {snapshot.quotes.map((q) => (
          <Row key={q.code} quote={q} flash={flashes[q.code] ?? null} />
        ))}
      </ul>

      <footer className="fx-widget-foot">
        {snapshot.asOf ? `As of ${snapshot.asOf.split(" ")[0]}` : "Indicative rates"}
      </footer>
    </section>
  );
}
