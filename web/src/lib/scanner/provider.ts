import type { Candle } from "./candles";

/** A source of closed H1 candles. Phase 1: Twelve Data. Phase 3: MT5 (pushed from a VPS). */
export interface DataProvider {
  readonly name: string;
  /** Up to `count` most recent CLOSED H1 candles, ascending by time. */
  getH1Candles(providerSymbol: string, count: number): Promise<Candle[]>;
}

const HOUR = 3_600_000;

/**
 * Twelve Data REST provider. Free "Basic" plan: 8 requests/minute, 800/day.
 * One time_series call costs 1 credit regardless of outputsize (max 5000).
 */
export class TwelveDataProvider implements DataProvider {
  readonly name = "twelvedata";
  private calls: number[] = [];
  constructor(private apiKey: string, private perMinute = 7) {}

  private async throttle() {
    for (;;) {
      const now = Date.now();
      this.calls = this.calls.filter((t) => now - t < 61_000);
      if (this.calls.length < this.perMinute) break;
      await sleep(61_000 - (now - this.calls[0]) + 250);
    }
    this.calls.push(Date.now());
  }

  async getH1Candles(providerSymbol: string, count: number): Promise<Candle[]> {
    const url = new URL("https://api.twelvedata.com/time_series");
    url.search = new URLSearchParams({
      symbol: providerSymbol,
      interval: "1h",
      outputsize: String(Math.min(Math.max(count, 1), 5000)),
      timezone: "UTC",
      order: "asc",
      apikey: this.apiKey,
    }).toString();

    for (let attempt = 0; attempt < 2; attempt++) {
      await this.throttle();
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as TwelveDataResponse;
      if (data.status === "error") {
        // Minute quota exhausted (e.g. a manual run overlapping cron): wait once and retry.
        if (data.code === 429 && attempt === 0) {
          await sleep(62_000);
          continue;
        }
        throw new Error(`Twelve Data ${data.code}: ${data.message}`);
      }
      const now = Date.now();
      return (data.values ?? [])
        .map((v) => ({
          time: Date.parse(v.datetime.replace(" ", "T") + "Z"),
          open: Number(v.open),
          high: Number(v.high),
          low: Number(v.low),
          close: Number(v.close),
        }))
        .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close) && c.time + HOUR <= now)
        .sort((a, b) => a.time - b.time);
    }
    throw new Error("Twelve Data: rate limited");
  }
}

type TwelveDataResponse = {
  status?: "ok" | "error";
  code?: number;
  message?: string;
  values?: { datetime: string; open: string; high: string; low: string; close: string }[];
};

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function getProvider(): DataProvider {
  const which = process.env.DATA_PROVIDER || "twelvedata";
  if (which === "twelvedata") {
    const key = process.env.TWELVE_DATA_API_KEY;
    if (!key) throw new Error("TWELVE_DATA_API_KEY is not set");
    return new TwelveDataProvider(key);
  }
  throw new Error(`Unsupported DATA_PROVIDER "${which}" (mt5 candles arrive via push, not pull)`);
}
