"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Broker, PatternInfo, Signal, SymbolInfo } from "@/lib/data";
import SignalTable from "./SignalTable";

type Props = {
  signals: Signal[];
  symbols: SymbolInfo[];
  patterns: PatternInfo[];
  brokers: Broker[];
};

const PERIODS: Record<string, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };

/** Filters run in the browser over the latest signals, so the page itself stays static and fast. */
export default function ScannerExplorer({ signals, symbols, patterns, brokers }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [now] = useState(() => Date.now());

  const f = {
    symbol: params.get("symbol") ?? "",
    tf: params.get("tf") ?? "",
    pattern: params.get("pattern") ?? "",
    dir: params.get("dir") ?? "",
    period: params.get("period") ?? "",
  };

  const set = (key: keyof typeof f, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const filtered = useMemo(() => {
    const cutoff = f.period && PERIODS[f.period] ? now - PERIODS[f.period] * 3_600_000 : 0;
    return signals.filter(
      (s) =>
        (!f.symbol || s.symbol === f.symbol) &&
        (!f.tf || s.timeframe === f.tf) &&
        (!f.pattern || s.pattern_slug === f.pattern) &&
        (!f.dir || s.direction === f.dir) &&
        (!cutoff || new Date(s.candle_time).getTime() >= cutoff),
    );
  }, [signals, now, f.symbol, f.tf, f.pattern, f.dir, f.period]);

  const active = Object.values(f).some(Boolean);

  return (
    <div>
      <div className="filters" role="search">
        <div className="field">
          <label htmlFor="f-symbol">Symbol</label>
          <select id="f-symbol" className="input" value={f.symbol} onChange={(e) => set("symbol", e.target.value)}>
            <option value="">All symbols</option>
            {symbols.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.display_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-tf">Timeframe</label>
          <select id="f-tf" className="input" value={f.tf} onChange={(e) => set("tf", e.target.value)}>
            <option value="">All</option>
            <option value="H1">H1</option>
            <option value="H4">H4</option>
            <option value="D1">D1</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-pattern">Pattern</label>
          <select id="f-pattern" className="input" value={f.pattern} onChange={(e) => set("pattern", e.target.value)}>
            <option value="">All patterns</option>
            {patterns.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-dir">Direction</label>
          <select id="f-dir" className="input" value={f.dir} onChange={(e) => set("dir", e.target.value)}>
            <option value="">Any</option>
            <option value="bullish">Bullish</option>
            <option value="bearish">Bearish</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-period">Date</label>
          <select id="f-period" className="input" value={f.period} onChange={(e) => set("period", e.target.value)}>
            <option value="">Any time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!active}
          style={{ cursor: active ? "pointer" : "default" }}
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          Reset
        </button>
      </div>
      <p className="filter-count">
        Showing {filtered.length} of {signals.length} recent detections
      </p>
      <SignalTable signals={filtered.slice(0, 200)} brokers={brokers} from={pathname} />
    </div>
  );
}
