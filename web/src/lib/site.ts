export const SITE = {
  name: "Bullish Hammer",
  domain: "bullishhammer.com",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://bullishhammer.com").replace(/\/$/, ""),
  tagline: "Free candlestick pattern scanner for forex, gold and crypto",
  description:
    "Free candlestick pattern scanner for forex, gold and crypto. See hammers, engulfing candles, dojis and more on H1, H4 and D1, updated every hour.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@bullishhammer.com",
};

export const RISK_WARNING =
  "CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. A large share of retail investor accounts lose money when trading CFDs. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.";

export const AFFILIATE_NOTE =
  "Bullish Hammer may earn a commission if you open an account with a broker through links on this site. This does not change what you pay.";

export const NOT_ADVICE =
  "Pattern detections are automated and for education only. They are not trade signals or financial advice.";

export const TIMEFRAMES = ["H1", "H4", "D1"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const NAV = [
  { href: "/scanner", label: "Scanner" },
  { href: "/patterns", label: "Patterns" },
  { href: "/news", label: "News" },
  { href: "/tools", label: "Tools" },
  { href: "/calendar", label: "Calendar" },
  { href: "/brokers", label: "Brokers" },
] as const;
