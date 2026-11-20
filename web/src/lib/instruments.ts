// Contract specs and currency conversion used by the client-side calculators.
// Specs are typical standard-account values; brokers can differ (noted on each tool page).

export type Instrument = {
  symbol: string;
  label: string;
  base: string;
  quote: string;
  contract: number; // units per 1.00 lot
  pip: number; // price move counted as one pip
};

const fx = (base: string, quote: string): Instrument => ({
  symbol: base + quote,
  label: `${base}/${quote}`,
  base,
  quote,
  contract: 100_000,
  pip: quote === "JPY" ? 0.01 : 0.0001,
});

export const INSTRUMENTS: Instrument[] = [
  fx("EUR", "USD"),
  fx("GBP", "USD"),
  fx("USD", "JPY"),
  fx("AUD", "USD"),
  fx("USD", "CAD"),
  fx("USD", "CHF"),
  fx("NZD", "USD"),
  fx("EUR", "JPY"),
  fx("GBP", "JPY"),
  fx("EUR", "GBP"),
  { symbol: "XAUUSD", label: "Gold (XAU/USD)", base: "XAU", quote: "USD", contract: 100, pip: 0.1 },
  // Silver (XAG/USD, 5000 oz, pip 0.01) needs a paid Twelve Data plan for its rate; add back when enabled.
];

export const ACCOUNT_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"] as const;

/** Value of one unit of each currency in USD, derived from the latest closes. */
export function usdValues(rates: Record<string, number>): Record<string, number> {
  const v: Record<string, number> = { USD: 1 };
  const direct: [string, string][] = [
    ["EUR", "EURUSD"],
    ["GBP", "GBPUSD"],
    ["AUD", "AUDUSD"],
    ["NZD", "NZDUSD"],
    ["XAU", "XAUUSD"],
    ["XAG", "XAGUSD"],
  ];
  for (const [ccy, sym] of direct) if (rates[sym]) v[ccy] = rates[sym];
  const inverse: [string, string][] = [
    ["JPY", "USDJPY"],
    ["CAD", "USDCAD"],
    ["CHF", "USDCHF"],
  ];
  for (const [ccy, sym] of inverse) if (rates[sym]) v[ccy] = 1 / rates[sym];
  return v;
}

/** Convert an amount between currencies via USD. Returns NaN if a rate is missing. */
export function convert(amount: number, from: string, to: string, usd: Record<string, number>): number {
  if (from === to) return amount;
  const a = usd[from];
  const b = usd[to];
  if (!a || !b) return NaN;
  return (amount * a) / b;
}

/** Pip value for `lots` in the account currency. */
export function pipValue(inst: Instrument, lots: number, account: string, usd: Record<string, number>) {
  return convert(lots * inst.contract * inst.pip, inst.quote, account, usd);
}

/** Required margin for `lots` at `leverage`:1, in the account currency. */
export function margin(inst: Instrument, lots: number, leverage: number, account: string, usd: Record<string, number>) {
  return convert((lots * inst.contract) / leverage, inst.base, account, usd);
}

export function fmt(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
