-- Phase 2: AI news runs, article edit tracking, broker review content.

ALTER TABLE news_articles ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE news_articles ADD COLUMN model text;
CREATE INDEX news_created_idx ON news_articles (created_at DESC);
CREATE INDEX news_symbols_idx ON news_articles USING gin (symbols);

-- One row per AI news generation attempt (cron or manual), with token usage and estimated cost.
CREATE TABLE news_runs (
  id             bigserial PRIMARY KEY,
  trigger        text NOT NULL,                     -- cron | manual
  started_at     timestamptz NOT NULL DEFAULT now(),
  finished_at    timestamptz,
  status         text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','skipped','error')),
  article_id     bigint REFERENCES news_articles(id) ON DELETE SET NULL,
  model          text,
  input_tokens   int NOT NULL DEFAULT 0,
  output_tokens  int NOT NULL DEFAULT 0,
  web_searches   int NOT NULL DEFAULT 0,
  cost_usd       numeric(10,4) NOT NULL DEFAULT 0,
  error          text
);
CREATE INDEX news_runs_started_idx ON news_runs (started_at DESC);

-- Broker review content. Sections: intro, accounts, platforms, regulation, pros, cons, verdict (markdown),
-- fact:<key> (short comparison-table values) and last_checked (date the figures were verified).
-- Starter figures below come from public sources and MUST be checked against each broker's site.
INSERT INTO broker_content (broker, section, content_md) VALUES
  ('xm', 'fact:regulation', 'CySEC (EU), ASIC (Australia), DFSA (Dubai); international clients via an offshore entity'),
  ('xm', 'fact:min_deposit', 'From $5 (Shares account: higher)'),
  ('xm', 'fact:max_leverage', 'Up to 1:1000 on the international entity; 1:30 for EU and Australian retail clients'),
  ('xm', 'fact:account_types', 'Micro, Standard, Ultra Low, Shares'),
  ('xm', 'fact:spreads', 'Ultra Low from about 0.6 pips on majors; Standard wider'),
  ('xm', 'fact:commission', 'No commission on Micro, Standard and Ultra Low'),
  ('xm', 'fact:platforms', 'MT4, MT5, XM app'),
  ('xm', 'fact:best_for', 'Small starting balances and beginners'),
  ('xm', 'last_checked', ''),
  ('xm', 'intro', 'XM is a large multi-regulated CFD broker known for very low minimum deposits, MetaTrader 4 and 5, and a wide range of educational material. It suits traders who want to start small and keep things simple.'),
  ('xm', 'accounts', E'- **Micro**: small contract sizes, useful for testing a strategy with very little at risk.\n- **Standard**: standard lot sizes, commission-free, spread-only pricing.\n- **Ultra Low**: tighter spreads than Standard, still without commission.\n- **Shares**: real shares, no leverage, with a much higher minimum deposit.\n\nWhich accounts you can open depends on the XM entity that serves your country.'),
  ('xm', 'platforms', 'XM offers MetaTrader 4 and MetaTrader 5 on desktop, web and mobile, plus its own XM app for account management and trading. Patterns found by the Bullish Hammer scanner use broker server time (New York close), so H4 and D1 candles line up with MT4/MT5 charts.'),
  ('xm', 'regulation', 'XM group companies are regulated by CySEC in the EU, ASIC in Australia and the DFSA in Dubai. Clients outside those regions are usually onboarded by an offshore entity, which allows higher leverage but offers weaker investor protection. Check which entity your account is opened with before you deposit.'),
  ('xm', 'pros', E'- Very low minimum deposit\n- Commission-free accounts\n- MT4 and MT5 on every device\n- Extensive free education and webinars'),
  ('xm', 'cons', E'- Spreads on the Standard account are wider than raw-spread ECN brokers\n- High leverage is only available through the offshore entity\n- No cTrader or TradingView trading'),
  ('xm', 'verdict', 'XM is a sensible first broker if you want to start with a small balance on MetaTrader and prefer simple, commission-free pricing. Active scalpers who trade large size may find raw-spread accounts elsewhere cheaper.'),

  ('icmarkets', 'fact:regulation', 'ASIC (Australia), CySEC (EU), SCB (Bahamas), FSA (Seychelles)'),
  ('icmarkets', 'fact:min_deposit', 'Typically $200 (varies by entity)'),
  ('icmarkets', 'fact:max_leverage', 'Up to 1:1000 on the international entity; 1:30 for EU and Australian retail clients'),
  ('icmarkets', 'fact:account_types', 'Standard, Raw Spread, cTrader Raw'),
  ('icmarkets', 'fact:spreads', 'Raw from 0.0 pips; Standard from about 0.8 pips'),
  ('icmarkets', 'fact:commission', 'Raw Spread about $3.50 per lot per side; Standard none'),
  ('icmarkets', 'fact:platforms', 'MT4, MT5, cTrader, TradingView'),
  ('icmarkets', 'fact:best_for', 'Active traders and scalpers who want raw spreads'),
  ('icmarkets', 'last_checked', ''),
  ('icmarkets', 'intro', 'IC Markets is a raw-spread CFD broker popular with active traders, scalpers and algorithmic traders. It is known for tight pricing on forex and gold and a wide choice of platforms.'),
  ('icmarkets', 'accounts', E'- **Standard**: no commission, spread includes the broker''s markup.\n- **Raw Spread**: spreads from 0.0 pips plus a fixed commission per lot, on MT4 and MT5.\n- **cTrader Raw**: raw pricing on the cTrader platform.\n\nMinimum deposits and leverage depend on the IC Markets entity that serves your country.'),
  ('icmarkets', 'platforms', 'IC Markets supports MetaTrader 4, MetaTrader 5, cTrader and TradingView. MetaTrader charts use broker server time, so the H4 and D1 patterns on Bullish Hammer match what you see in MT4/MT5.'),
  ('icmarkets', 'regulation', 'IC Markets operates through entities regulated by ASIC in Australia, CySEC in the EU, the SCB in the Bahamas and the FSA in Seychelles. The offshore entities allow higher leverage but offer weaker investor protection. Check which entity your account is opened with before you deposit.'),
  ('icmarkets', 'pros', E'- Raw spreads from 0.0 pips on major pairs\n- Choice of MT4, MT5, cTrader and TradingView\n- Well suited to scalping and automated trading\n- Fast execution'),
  ('icmarkets', 'cons', E'- Higher minimum deposit than XM\n- Raw accounts charge commission, which adds up for small trades\n- Education content is lighter than some competitors'),
  ('icmarkets', 'verdict', 'IC Markets is a strong choice for active traders who place many trades and care about total trading cost. Beginners with very small balances may prefer a broker with a lower minimum deposit.');
