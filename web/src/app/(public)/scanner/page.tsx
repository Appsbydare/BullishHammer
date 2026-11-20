import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getBrokers, getPatterns, getScannerStatus, getSignals, getSymbols } from "@/lib/data";
import { NOT_ADVICE } from "@/lib/site";
import { timeAgo } from "@/lib/format";
import ScannerExplorer from "@/components/ScannerExplorer";
import SignalTable from "@/components/SignalTable";
import BrokerAside from "@/components/BrokerAside";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Candlestick Pattern Scanner: Forex, Gold & Crypto",
  description:
    "Live candlestick pattern scanner for forex, gold and crypto markets on H1, H4 and D1. Hammers, engulfing patterns, dojis, stars and more, updated hourly.",
  alternates: { canonical: "/scanner" },
};

export default async function ScannerPage() {
  const [signals, symbols, patterns, brokers, status] = await Promise.all([
    getSignals({ limit: 400 }),
    getSymbols(),
    getPatterns(),
    getBrokers(),
    getScannerStatus(),
  ]);

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Pattern scanner</p>
        <h1>Candlestick pattern scanner</h1>
        <p>
          Every pattern detected on closed H1, H4 and D1 candles across {symbols.length} markets.
          {status.lastRun ? ` Last scan ${timeAgo(status.lastRun)}.` : ""} Times are in UTC; D1 candles follow the
          broker trading day (New York 5pm close).
        </p>
      </div>
      <div className="chips" style={{ marginBottom: 24 }}>
        {symbols.map((s) => (
          <Link key={s.symbol} href={`/scanner/${s.symbol.toLowerCase()}`} className="chip">
            {s.symbol}
          </Link>
        ))}
      </div>
      <div className="with-aside">
        <div>
          <Suspense fallback={<SignalTable signals={signals.slice(0, 50)} brokers={brokers} from="/scanner" />}>
            <ScannerExplorer signals={signals} symbols={symbols} patterns={patterns} brokers={brokers} />
          </Suspense>
          <p className="notice" style={{ marginTop: 20 }}>
            {NOT_ADVICE} Trend context compares the candle close with the 50-period EMA on the same timeframe. A
            bullish pattern below the EMA (or a bearish one above it) is a classic reversal setup.
          </p>
        </div>
        <BrokerAside brokers={brokers} />
      </div>
    </div>
  );
}
