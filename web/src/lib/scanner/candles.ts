// Candle types and H1 → H4/D1 aggregation aligned to broker server time.
//
// XM, IC Markets and most MT5 brokers run their servers on "New York close" time:
// UTC+2 in winter, UTC+3 while New York observes DST. The trading day starts at
// 17:00 New York. Building H4/D1 on this clock makes our candles match what
// visitors see on their MT5 charts, instead of midnight-UTC candles.

export type Candle = {
  time: number; // open time, epoch ms (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
};

export type Timeframe = "H1" | "H4" | "D1";

const HOUR = 3_600_000;
export const TF_HOURS: Record<Timeframe, number> = { H1: 1, H4: 4, D1: 24 };

const nyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
});

const offsetCache = new Map<number, number>();

/** Hours to add to UTC to get broker server time (2 or 3). */
export function serverOffsetHours(utcMs: number): number {
  const key = Math.floor(utcMs / HOUR);
  const cached = offsetCache.get(key);
  if (cached !== undefined) return cached;
  const parts = Object.fromEntries(nyFormatter.formatToParts(new Date(key * HOUR)).map((p) => [p.type, p.value]));
  const nyAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour);
  const nyOffset = Math.round((nyAsUtc - key * HOUR) / HOUR); // -5 or -4
  const off = nyOffset + 7;
  offsetCache.set(key, off);
  return off;
}

/** Start (UTC ms) of the H4/D1 bucket containing an H1 candle. */
export function bucketStart(utcMs: number, tf: Timeframe): number {
  if (tf === "H1") return utcMs;
  const off = serverOffsetHours(utcMs) * HOUR;
  const size = TF_HOURS[tf] * HOUR;
  return Math.floor((utcMs + off) / size) * size - off;
}

/**
 * Aggregate ascending, closed H1 candles into a higher timeframe.
 * Only buckets that are fully closed are returned: the bucket's end must be at or
 * before the end of the newest H1 candle. The first bucket is dropped because the
 * history may start part-way through it.
 */
export function aggregate(h1: Candle[], tf: Timeframe): Candle[] {
  if (tf === "H1" || h1.length === 0) return h1;
  const out: Candle[] = [];
  let cur: Candle | null = null;
  for (const c of h1) {
    const start = bucketStart(c.time, tf);
    if (!cur || cur.time !== start) {
      if (cur) out.push(cur);
      cur = { time: start, open: c.open, high: c.high, low: c.low, close: c.close };
    } else {
      cur.high = Math.max(cur.high, c.high);
      cur.low = Math.min(cur.low, c.low);
      cur.close = c.close;
    }
  }
  if (cur) out.push(cur);

  const lastH1End = h1[h1.length - 1].time + HOUR;
  const size = TF_HOURS[tf] * HOUR;
  // Bucket length is constant in UTC except across a DST switch, which happens on a weekend.
  const closed = out.filter((b) => b.time + size <= lastH1End);
  return closed.slice(1);
}

/** Exponential moving average of closes; undefined until `period` values exist. */
export function ema(candles: Candle[], period: number): (number | undefined)[] {
  const k = 2 / (period + 1);
  const out: (number | undefined)[] = new Array(candles.length).fill(undefined);
  let prev: number | undefined;
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i].close;
    if (i < period - 1) {
      sum += c;
      continue;
    }
    if (i === period - 1) {
      sum += c;
      prev = sum / period;
    } else {
      prev = c * k + (prev as number) * (1 - k);
    }
    out[i] = prev;
  }
  return out;
}

/** Calendar date label for a D1 candle (server trading day), e.g. "2026-11-20". */
export function tradingDay(utcMs: number): string {
  // D1 opens at 21:00/22:00 UTC the previous evening; +12h lands inside the trading day.
  return new Date(utcMs + 12 * HOUR).toISOString().slice(0, 10);
}
