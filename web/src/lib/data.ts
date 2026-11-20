import "server-only";
import { query } from "@/lib/db";

// Everything the public site shows comes from Neon. Pages never call the data provider.

export type SymbolInfo = { id: number; symbol: string; display_name: string; category: string };
export type PatternInfo = {
  id: number;
  slug: string;
  name: string;
  direction: "bullish" | "bearish" | "neutral";
  candles: number;
  description: string;
};
export type Signal = {
  id: number;
  symbol: string;
  symbol_name: string;
  category: string;
  pattern_slug: string;
  pattern_name: string;
  timeframe: "H1" | "H4" | "D1";
  candle_time: string; // ISO
  direction: "bullish" | "bearish" | "neutral";
  trend_context: "uptrend" | "downtrend" | null;
};
export type Broker = {
  broker: string;
  name: string;
  url: string | null;
  banner_src: string | null;
  banner_width: number | null;
  banner_height: number | null;
  blocked_countries: string[];
};

export async function getSymbols(): Promise<SymbolInfo[]> {
  return query<SymbolInfo>(
    "SELECT id, symbol, display_name, category FROM symbols WHERE active ORDER BY sort_order",
  );
}

export async function getSymbol(symbol: string): Promise<SymbolInfo | null> {
  const [row] = await query<SymbolInfo>(
    "SELECT id, symbol, display_name, category FROM symbols WHERE active AND symbol = upper($1)",
    [symbol],
  );
  return row ?? null;
}

export async function getPatterns(): Promise<PatternInfo[]> {
  return query<PatternInfo>(
    "SELECT id, slug, name, direction, candles, description FROM patterns WHERE active ORDER BY sort_order",
  );
}

export async function getPattern(slug: string): Promise<PatternInfo | null> {
  const [row] = await query<PatternInfo>(
    "SELECT id, slug, name, direction, candles, description FROM patterns WHERE active AND slug = $1",
    [slug],
  );
  return row ?? null;
}

export async function getSignals(
  opts: { limit?: number; symbol?: string; symbols?: string[]; pattern?: string } = {},
): Promise<Signal[]> {
  const where = ["s.active", "p.active"];
  const params: unknown[] = [];
  if (opts.symbol) {
    params.push(opts.symbol.toUpperCase());
    where.push(`s.symbol = $${params.length}`);
  }
  if (opts.symbols) {
    params.push(opts.symbols.map((x) => x.toUpperCase()));
    where.push(`s.symbol = ANY($${params.length}::text[])`);
  }
  if (opts.pattern) {
    params.push(opts.pattern);
    where.push(`p.slug = $${params.length}`);
  }
  params.push(opts.limit ?? 100);
  const rows = await query<Signal & { candle_time: string | Date }>(
    `SELECT g.id, s.symbol, s.display_name AS symbol_name, s.category, p.slug AS pattern_slug, p.name AS pattern_name,
            g.timeframe, g.candle_time, g.direction, g.trend_context
     FROM signals g JOIN symbols s ON s.id = g.symbol_id JOIN patterns p ON p.id = g.pattern_id
     WHERE ${where.join(" AND ")}
     ORDER BY g.candle_time DESC, g.id DESC
     LIMIT $${params.length}`,
    params,
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), candle_time: new Date(r.candle_time).toISOString() }));
}

export async function getScannerStatus(): Promise<{ lastRun: string | null; signals24h: number; totalSignals: number }> {
  const [row] = await query<{ last_run: string | Date | null; s24: string; total: string }>(
    `SELECT (SELECT max(finished_at) FROM scanner_runs WHERE status IN ('success','partial')) AS last_run,
            (SELECT count(*) FROM signals WHERE created_at > now() - interval '24 hours') AS s24,
            (SELECT count(*) FROM signals) AS total`,
  );
  return {
    lastRun: row?.last_run ? new Date(row.last_run).toISOString() : null,
    signals24h: Number(row?.s24 ?? 0),
    totalSignals: Number(row?.total ?? 0),
  };
}

/** Active brokers. CTAs only render for brokers returned here. */
export async function getBrokers(): Promise<Broker[]> {
  return query<Broker>(
    `SELECT broker, name, url, banner_src, banner_width, banner_height, blocked_countries
     FROM affiliate_links WHERE active ORDER BY id`,
  );
}

/** Latest stored H1 close per active symbol, for calculator currency conversion. */
export async function getLatestCloses(): Promise<{ rates: Record<string, number>; asOf: string | null }> {
  const rows = await query<{ symbol: string; close: number; open_time: string | Date }>(
    `SELECT DISTINCT ON (c.symbol_id) s.symbol, c.close, c.open_time
     FROM candles c JOIN symbols s ON s.id = c.symbol_id
     WHERE c.timeframe = 'H1' AND s.category IN ('forex','metal')
     ORDER BY c.symbol_id, c.open_time DESC`,
  );
  const rates: Record<string, number> = {};
  let asOf = 0;
  for (const r of rows) {
    rates[r.symbol] = r.close;
    asOf = Math.max(asOf, new Date(r.open_time).getTime());
  }
  return { rates, asOf: asOf ? new Date(asOf + 3_600_000).toISOString() : null };
}
