import Link from "next/link";
import type { Broker, Signal } from "@/lib/data";
import { GUIDES } from "@/lib/pattern-guides";
import { candleLabel } from "@/lib/format";
import PatternChart from "./PatternChart";

export function DirectionBadge({ direction }: { direction: Signal["direction"] }) {
  const label = direction === "bullish" ? "Bullish" : direction === "bearish" ? "Bearish" : "Neutral";
  return (
    <span className={`badge badge-${direction}`}>
      <span className="dot" aria-hidden />
      {label}
    </span>
  );
}

/** Trend context: a reversal pattern against the EMA-50 trend is the textbook "stronger" setup. */
export function TrendNote({ s }: { s: Pick<Signal, "direction" | "trend_context"> }) {
  if (!s.trend_context) return <span className="trend-note">Not enough history</span>;
  const pos = s.trend_context === "uptrend" ? "Above EMA 50" : "Below EMA 50";
  const reversal =
    (s.direction === "bullish" && s.trend_context === "downtrend") ||
    (s.direction === "bearish" && s.trend_context === "uptrend");
  if (s.direction === "neutral") return <span className="trend-note">{pos}</span>;
  return (
    <span className={`trend-note${reversal ? " strong" : ""}`}>
      {pos} · {reversal ? "reversal setup" : "with trend"}
    </span>
  );
}

export function TradeLinks({ symbol, brokers, from }: { symbol: string; brokers: Broker[]; from: string }) {
  const linked = brokers.filter((b) => b.url);
  if (linked.length === 0) return null;
  return (
    <>
      {linked.map((b) => (
        <a
          key={b.broker}
          className="btn btn-ghost btn-sm"
          href={`/go/${b.broker}?symbol=${encodeURIComponent(symbol)}&from=${encodeURIComponent(from)}`}
          rel="nofollow sponsored noopener"
          target="_blank"
        >
          Trade {symbol} on {b.name}
        </a>
      ))}
    </>
  );
}

type Props = { signals: Signal[]; brokers: Broker[]; from: string; showSymbol?: boolean };

export default function SignalTable({ signals, brokers, from, showSymbol = true }: Props) {
  if (signals.length === 0) {
    return <div className="table-wrap empty">No patterns match yet. The scanner checks every hour.</div>;
  }
  return (
    <div className="table-wrap">
      <table className="signals">
        <thead>
          <tr>
            {showSymbol && <th>Symbol</th>}
            <th>Pattern</th>
            <th>TF</th>
            <th>Candle</th>
            <th>Trend context</th>
            <th>
              <span className="sr-only">Trade</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => {
            const g = GUIDES[s.pattern_slug];
            return (
              <tr key={s.id}>
                {showSymbol && (
                  <td data-col="symbol">
                    <Link href={`/scanner/${s.symbol.toLowerCase()}`} className="sig-symbol">
                      {s.symbol}
                    </Link>
                  </td>
                )}
                <td data-col="pattern">
                  <div className="sig-pattern">
                    {g && (
                      <span className="sig-glyph" style={{ width: 44 }}>
                        <PatternChart bars={g.bars} patternBars={g.patternBars} width={44} height={28} compact />
                      </span>
                    )}
                    <Link href={`/patterns/${s.pattern_slug}`}>{s.pattern_name}</Link>
                    <DirectionBadge direction={s.direction} />
                  </div>
                </td>
                <td data-col="tf">
                  <span className="badge badge-tf">{s.timeframe}</span>
                </td>
                <td data-col="time" className="num">
                  {candleLabel(s.timeframe, s.candle_time)}
                </td>
                <td data-col="trend">
                  <TrendNote s={s} />
                </td>
                <td data-col="cta" className="sig-cta">
                  <TradeLinks symbol={s.symbol} brokers={brokers} from={from} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
