import "server-only";
import { query } from "@/lib/db";
import { aggregate, ema, type Candle, type Timeframe } from "./candles";
import { detectAt } from "./detect";
import { getProvider } from "./provider";

const HOUR = 3_600_000;
const BACKFILL = 5000; // H1 candles fetched for a symbol with no history (~10 months of forex)
const DETECT_WINDOW = 2400; // H1 candles loaded for detection (≈ 75 trading days → enough D1 bars for EMA 50)
const SCAN_RECENT = 6; // closed candles re-checked per timeframe each run (catches missed runs)
const SCAN_BACKFILL = 300; // candles scanned per timeframe right after a backfill
const TIMEFRAMES: Timeframe[] = ["H1", "H4", "D1"];

export type RunSummary = {
  runId: number;
  status: "success" | "partial" | "error";
  symbolsScanned: number;
  candlesStored: number;
  signalsFound: number;
  errors: string[];
};

type SymbolRow = { id: number; symbol: string; provider_symbol: string };
type PatternRow = { id: number; slug: string; direction: string };

export async function runScanner(trigger: "cron" | "manual"): Promise<RunSummary> {
  const [run] = await query<{ id: number }>(
    "INSERT INTO scanner_runs (trigger) VALUES ($1) RETURNING id",
    [trigger],
  );
  const errors: string[] = [];
  let symbolsScanned = 0;
  let candlesStored = 0;
  let signalsFound = 0;

  try {
    const provider = getProvider();
    const symbols = await query<SymbolRow>(
      "SELECT id, symbol, provider_symbol FROM symbols WHERE active ORDER BY sort_order",
    );
    const patterns = await query<PatternRow>("SELECT id, slug, direction FROM patterns WHERE active");
    const bySlug = new Map(patterns.map((p) => [p.slug, p]));

    for (const s of symbols) {
      try {
        // 1. Fetch new closed H1 candles and store them.
        const [{ last }] = await query<{ last: string | Date | null }>(
          "SELECT max(open_time) AS last FROM candles WHERE symbol_id = $1 AND timeframe = 'H1'",
          [s.id],
        );
        const backfill = !last;
        const need = backfill ? BACKFILL : Math.ceil((Date.now() - new Date(last as string).getTime()) / HOUR) + 3;
        const fresh = await provider.getH1Candles(s.provider_symbol, Math.min(need, BACKFILL));
        candlesStored += await storeCandles(s.id, fresh, provider.name);

        // 2. Load recent history from the DB and detect patterns on each timeframe.
        const h1 = (
          await query<{ t: string | Date; o: number; h: number; l: number; c: number }>(
            `SELECT open_time AS t, open AS o, high AS h, low AS l, close AS c FROM (
               SELECT * FROM candles WHERE symbol_id = $1 AND timeframe = 'H1'
               ORDER BY open_time DESC LIMIT $2) x ORDER BY open_time ASC`,
            [s.id, backfill ? BACKFILL : DETECT_WINDOW],
          )
        ).map((r) => ({ time: new Date(r.t).getTime(), open: r.o, high: r.h, low: r.l, close: r.c }));

        const found: { patternId: number; tf: Timeframe; time: number; direction: string; trend: string | null }[] = [];
        for (const tf of TIMEFRAMES) {
          const cs = aggregate(h1, tf);
          const e50 = ema(cs, 50);
          const from = Math.max(0, cs.length - (backfill ? SCAN_BACKFILL : SCAN_RECENT));
          for (let i = from; i < cs.length; i++) {
            for (const slug of detectAt(cs, i)) {
              const p = bySlug.get(slug);
              if (!p) continue;
              const e = e50[i];
              found.push({
                patternId: p.id,
                tf,
                time: cs[i].time,
                direction: p.direction,
                trend: e === undefined ? null : cs[i].close >= e ? "uptrend" : "downtrend",
              });
            }
          }
        }
        signalsFound += await storeSignals(s.id, found);
        symbolsScanned++;
      } catch (err) {
        errors.push(`${s.symbol}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const status = errors.length === 0 ? "success" : symbolsScanned > 0 ? "partial" : "error";
    await finish(run.id, status, symbolsScanned, candlesStored, signalsFound, errors);
    return { runId: Number(run.id), status, symbolsScanned, candlesStored, signalsFound, errors };
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
    await finish(run.id, "error", symbolsScanned, candlesStored, signalsFound, errors);
    return { runId: Number(run.id), status: "error", symbolsScanned, candlesStored, signalsFound, errors };
  }
}

async function storeCandles(symbolId: number, cs: Candle[], source: string) {
  if (cs.length === 0) return 0;
  // Upsert: providers occasionally revise the most recent bars.
  const rows = await query(
    `INSERT INTO candles (symbol_id, timeframe, open_time, open, high, low, close, source)
     SELECT $1, 'H1', t, o, h, l, c, $7
     FROM unnest($2::timestamptz[], $3::float8[], $4::float8[], $5::float8[], $6::float8[]) AS u(t, o, h, l, c)
     ON CONFLICT (symbol_id, timeframe, open_time)
     DO UPDATE SET open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, close = EXCLUDED.close
     RETURNING 1`,
    [
      symbolId,
      cs.map((c) => new Date(c.time).toISOString()),
      cs.map((c) => c.open),
      cs.map((c) => c.high),
      cs.map((c) => c.low),
      cs.map((c) => c.close),
      source,
    ],
  );
  return rows.length;
}

async function storeSignals(
  symbolId: number,
  found: { patternId: number; tf: Timeframe; time: number; direction: string; trend: string | null }[],
) {
  if (found.length === 0) return 0;
  const rows = await query(
    `INSERT INTO signals (symbol_id, pattern_id, timeframe, candle_time, direction, trend_context)
     SELECT $1, p, tf, t, d, tr
     FROM unnest($2::int[], $3::text[], $4::timestamptz[], $5::text[], $6::text[]) AS u(p, tf, t, d, tr)
     ON CONFLICT (symbol_id, pattern_id, timeframe, candle_time) DO NOTHING
     RETURNING 1`,
    [
      symbolId,
      found.map((f) => f.patternId),
      found.map((f) => f.tf),
      found.map((f) => new Date(f.time).toISOString()),
      found.map((f) => f.direction),
      found.map((f) => f.trend),
    ],
  );
  return rows.length;
}

async function finish(
  id: number,
  status: string,
  scanned: number,
  stored: number,
  found: number,
  errors: string[],
) {
  await query(
    `UPDATE scanner_runs SET finished_at = now(), status = $2, symbols_scanned = $3,
       candles_stored = $4, signals_found = $5, error = $6 WHERE id = $1`,
    [id, status, scanned, stored, found, errors.length ? errors.join("\n").slice(0, 4000) : null],
  );
}
