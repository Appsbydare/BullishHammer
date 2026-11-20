// Candlestick pattern detection on closed candles.
//
// Thresholds are deliberately on the strict side: on H1 data loose rules produce
// a flood of low-quality dojis and hammers. Size filters compare each candle with
// the average of the 10 candles before the pattern, so a "hammer" in a dead
// Asian-session hour is ignored.

import type { Candle } from "./candles";

export type PatternSlug =
  | "bullish-hammer"
  | "inverted-hammer"
  | "hanging-man"
  | "shooting-star"
  | "bullish-engulfing"
  | "bearish-engulfing"
  | "doji"
  | "dragonfly-doji"
  | "gravestone-doji"
  | "morning-star"
  | "evening-star"
  | "bullish-harami"
  | "bearish-harami"
  | "tweezer-top"
  | "tweezer-bottom";

const LOOKBACK = 10; // candles used for average size
const TREND_SPAN = 5; // candles used for the prior short-term move

const body = (c: Candle) => Math.abs(c.close - c.open);
const range = (c: Candle) => c.high - c.low;
const upper = (c: Candle) => c.high - Math.max(c.open, c.close);
const lower = (c: Candle) => Math.min(c.open, c.close) - c.low;
const bull = (c: Candle) => c.close > c.open;
const bear = (c: Candle) => c.close < c.open;

type Ctx = { avgBody: number; avgRange: number; trend: "up" | "down" | "flat" };

/** Average size of the LOOKBACK candles before index `j`, and the short-term move into `j`. */
function context(cs: Candle[], j: number): Ctx | null {
  if (j < LOOKBACK + 1 || j < TREND_SPAN + 1) return null;
  let b = 0;
  let r = 0;
  for (let k = j - LOOKBACK; k < j; k++) {
    b += body(cs[k]);
    r += range(cs[k]);
  }
  const avgBody = b / LOOKBACK;
  const avgRange = r / LOOKBACK;
  if (avgRange <= 0) return null;
  const move = cs[j - 1].close - cs[j - 1 - TREND_SPAN].close;
  const thr = 0.5 * avgRange;
  const trend = move <= -thr ? "down" : move >= thr ? "up" : "flat";
  return { avgBody, avgRange, trend };
}

/** Patterns completed by candle `i` (the last candle of each pattern). */
export function detectAt(cs: Candle[], i: number): PatternSlug[] {
  const found: PatternSlug[] = [];
  const c = cs[i];
  const r = range(c);

  // ── Single-candle patterns ──
  const x1 = context(cs, i);
  if (x1 && r > 0) {
    const b = body(c);
    const isDoji = b <= 0.1 * r;
    if (isDoji && r >= 0.5 * x1.avgRange) {
      if (upper(c) <= 0.1 * r && lower(c) >= 0.7 * r) found.push("dragonfly-doji");
      else if (lower(c) <= 0.1 * r && upper(c) >= 0.7 * r) found.push("gravestone-doji");
      else found.push("doji");
    }
    if (!isDoji && r >= 0.8 * x1.avgRange) {
      const hammerShape = lower(c) >= 2 * b && upper(c) <= 0.1 * r;
      const invertedShape = upper(c) >= 2 * b && lower(c) <= 0.1 * r;
      if (hammerShape && x1.trend === "down") found.push("bullish-hammer");
      if (hammerShape && x1.trend === "up") found.push("hanging-man");
      if (invertedShape && x1.trend === "down") found.push("inverted-hammer");
      if (invertedShape && x1.trend === "up") found.push("shooting-star");
    }
  }

  // ── Two-candle patterns (p = previous, c = current) ──
  if (i >= 1) {
    const p = cs[i - 1];
    const x2 = context(cs, i - 1);
    if (x2) {
      const bp = body(p);
      const bc = body(c);
      // Engulfing: current body covers the previous body.
      if (x2.trend === "down" && bear(p) && bull(c) && c.open <= p.close && c.close >= p.open && bc > bp && bc >= 0.6 * x2.avgBody)
        found.push("bullish-engulfing");
      if (x2.trend === "up" && bull(p) && bear(c) && c.open >= p.close && c.close <= p.open && bc > bp && bc >= 0.6 * x2.avgBody)
        found.push("bearish-engulfing");
      // Harami: small opposite body inside a long previous body.
      if (x2.trend === "down" && bear(p) && bull(c) && bp >= x2.avgBody && bc <= 0.5 * bp && c.close <= p.open && c.open >= p.close)
        found.push("bullish-harami");
      if (x2.trend === "up" && bull(p) && bear(c) && bp >= x2.avgBody && bc <= 0.5 * bp && c.close >= p.open && c.open <= p.close)
        found.push("bearish-harami");
      // Tweezers: matching extremes at a fresh 5-candle extreme.
      const tol = 0.05 * x2.avgRange;
      const big = range(p) >= 0.5 * x2.avgRange && range(c) >= 0.5 * x2.avgRange;
      if (x2.trend === "down" && bear(p) && bull(c) && big && Math.abs(p.low - c.low) <= tol) {
        const recentLow = Math.min(...cs.slice(i - 6, i - 1).map((k) => k.low));
        if (Math.min(p.low, c.low) <= recentLow) found.push("tweezer-bottom");
      }
      if (x2.trend === "up" && bull(p) && bear(c) && big && Math.abs(p.high - c.high) <= tol) {
        const recentHigh = Math.max(...cs.slice(i - 6, i - 1).map((k) => k.high));
        if (Math.max(p.high, c.high) >= recentHigh) found.push("tweezer-top");
      }
    }
  }

  // ── Three-candle patterns (a, m, c) ──
  if (i >= 2) {
    const a = cs[i - 2];
    const m = cs[i - 1];
    const x3 = context(cs, i - 2);
    if (x3) {
      const ba = body(a);
      const small = body(m) <= 0.3 * ba;
      const mid = (a.open + a.close) / 2;
      if (x3.trend === "down" && bear(a) && ba >= x3.avgBody && small && bull(c) && body(c) >= 0.5 * x3.avgBody && c.close >= mid)
        found.push("morning-star");
      if (x3.trend === "up" && bull(a) && ba >= x3.avgBody && small && bear(c) && body(c) >= 0.5 * x3.avgBody && c.close <= mid)
        found.push("evening-star");
    }
  }

  return found;
}
