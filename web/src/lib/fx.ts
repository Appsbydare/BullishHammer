/**
 * FX rate data layer.
 *
 * Two sources are used deliberately:
 *  - CurrencyFreaks  -> live spot rates (key-gated, 1k req/month on free tier)
 *  - Frankfurter     -> 30-day history for sparklines (free, no key, ECB data)
 *
 * CurrencyFreaks' historical endpoint requires a paid plan (returns HTTP 402 on
 * the free tier), which is why history comes from Frankfurter instead.
 */

// Pairs we display, in order. `invert` marks pairs conventionally quoted as
// XXX/USD rather than USD/XXX.
//
// The upstream APIs return USD-based rates (i.e. how much foreign currency 1 USD
// buys). EUR/GBP/AUD/NZD are quoted the other way round in FX markets, so their
// raw values must be inverted before display. Skipping this step is what made
// the old widget show EUR/USD as ~0.87 instead of the correct ~1.15.
export const FX_PAIRS = [
  { code: "EUR", label: "EUR/USD", invert: true, decimals: 4 },
  { code: "GBP", label: "GBP/USD", invert: true, decimals: 4 },
  { code: "JPY", label: "USD/JPY", invert: false, decimals: 2 },
  { code: "CHF", label: "USD/CHF", invert: false, decimals: 4 },
  { code: "AUD", label: "AUD/USD", invert: true, decimals: 4 },
  { code: "CAD", label: "USD/CAD", invert: false, decimals: 4 },
] as const;

const SYMBOLS = FX_PAIRS.map((p) => p.code).join(",");

export interface FxQuote {
  code: string;
  label: string;
  /** Display-ready rate, already inverted where appropriate. */
  rate: number;
  decimals: number;
  /** Absolute change vs. ~30 days ago. Null when history is unavailable. */
  change: number | null;
  /** Percentage change vs. ~30 days ago. Null when history is unavailable. */
  changePct: number | null;
  /** Normalised 0-100 sparkline points, oldest to newest. */
  spark: number[];
}

export interface FxSnapshot {
  quotes: FxQuote[];
  asOf: string | null;
  /** True when spot rates are placeholders rather than live data. */
  stale: boolean;
}

function applyInversion(raw: number, invert: boolean): number {
  if (!Number.isFinite(raw) || raw === 0) return NaN;
  return invert ? 1 / raw : raw;
}

/** Scales a series to 0-100 so the sparkline is viewBox-independent. */
function normalise(series: number[]): number[] {
  if (series.length < 2) return [];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min;
  // A perfectly flat series would divide by zero; render it as a centre line.
  if (span === 0) return series.map(() => 50);
  return series.map((v) => ((v - min) / span) * 100);
}

/** Live spot rates from CurrencyFreaks. Returns null on any failure. */
async function fetchSpot(): Promise<{ rates: Record<string, string>; date: string } | null> {
  const apiKey = process.env.CURRENCYFREAKS_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${apiKey}&symbols=${SYMBOLS}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`CurrencyFreaks responded ${res.status}`);
    const data = await res.json();
    if (!data?.rates) throw new Error("CurrencyFreaks payload missing rates");
    return { rates: data.rates, date: data.date };
  } catch (error) {
    console.error("FX spot fetch failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** 30-day daily history from Frankfurter, keyed by currency code. */
async function fetchHistory(): Promise<Record<string, number[]>> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const res = await fetch(
      `https://api.frankfurter.dev/v1/${fmt(start)}..${fmt(end)}?base=USD&symbols=${SYMBOLS}`,
      { next: { revalidate: 21600 } } // 6h — ECB publishes once per working day
    );
    if (!res.ok) throw new Error(`Frankfurter responded ${res.status}`);

    const data = await res.json();
    const byDate: Record<string, Record<string, number>> = data?.rates ?? {};
    const dates = Object.keys(byDate).sort();

    const series: Record<string, number[]> = {};
    for (const { code } of FX_PAIRS) series[code] = [];
    for (const date of dates) {
      for (const { code } of FX_PAIRS) {
        const v = byDate[date]?.[code];
        if (typeof v === "number") series[code].push(v);
      }
    }
    return series;
  } catch (error) {
    console.error("FX history fetch failed:", error instanceof Error ? error.message : error);
    return {};
  }
}

// Used only when the live API is unavailable, so the page still renders.
const PLACEHOLDER: Record<string, number> = {
  EUR: 0.8678, GBP: 0.7429, JPY: 160.2, CHF: 0.8058, AUD: 1.4234, CAD: 1.4012,
};

/**
 * Builds the full FX snapshot: display-ready rates, 30-day change, sparklines.
 */
export async function getFXSnapshot(): Promise<FxSnapshot> {
  const [spot, history] = await Promise.all([fetchSpot(), fetchHistory()]);

  const rawRates: Record<string, number> = {};
  for (const { code } of FX_PAIRS) {
    const fromSpot = spot?.rates?.[code];
    rawRates[code] = fromSpot !== undefined ? Number(fromSpot) : PLACEHOLDER[code];
  }

  const quotes: FxQuote[] = FX_PAIRS.map(({ code, label, invert, decimals }) => {
    const rate = applyInversion(rawRates[code], invert);
    const rawSeries = history[code] ?? [];
    const series = rawSeries.map((v) => applyInversion(v, invert)).filter(Number.isFinite);

    let change: number | null = null;
    let changePct: number | null = null;
    if (series.length >= 2) {
      const first = series[0];
      // Compare against the live rate so the delta reflects the number shown.
      const latest = Number.isFinite(rate) ? rate : series[series.length - 1];
      change = latest - first;
      changePct = first !== 0 ? (change / first) * 100 : null;
    }

    // Append the live rate so the sparkline ends at the displayed value.
    const sparkSource = Number.isFinite(rate) ? [...series, rate] : series;

    return {
      code,
      label,
      rate,
      decimals,
      change,
      changePct,
      spark: normalise(sparkSource),
    };
  });

  return { quotes, asOf: spot?.date ?? null, stale: !spot };
}
