-- BullishHammer core schema (Phase 1 + tables reserved for Phase 2/3).
-- Applied by `npm run db:migrate`. Never edit an applied migration; add a new file.

-- ── Instruments & patterns ─────────────────────────────────────────────
CREATE TABLE symbols (
  id              serial PRIMARY KEY,
  symbol          text NOT NULL UNIQUE,              -- canonical, e.g. XAUUSD
  provider_symbol text NOT NULL,                     -- data-provider ticker, e.g. XAU/USD
  display_name    text NOT NULL,
  category        text NOT NULL CHECK (category IN ('forex','metal','index','crypto','commodity')),
  sort_order      int  NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true
);

CREATE TABLE patterns (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  direction   text NOT NULL CHECK (direction IN ('bullish','bearish','neutral')),
  candles     smallint NOT NULL,
  description text NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true
);

-- ── Market data (internal only, never shown raw on the public site) ────
-- H1 candles from the data provider. H4/D1 are built from these in code.
CREATE TABLE candles (
  symbol_id  int  NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  timeframe  text NOT NULL CHECK (timeframe IN ('H1')),
  open_time  timestamptz NOT NULL,
  open       double precision NOT NULL,
  high       double precision NOT NULL,
  low        double precision NOT NULL,
  close      double precision NOT NULL,
  source     text NOT NULL,
  PRIMARY KEY (symbol_id, timeframe, open_time)
);

-- ── Scanner output ─────────────────────────────────────────────────────
CREATE TABLE signals (
  id            bigserial PRIMARY KEY,
  symbol_id     int  NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  pattern_id    int  NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  timeframe     text NOT NULL CHECK (timeframe IN ('H1','H4','D1')),
  candle_time   timestamptz NOT NULL,                -- open time (UTC) of the last candle in the pattern
  direction     text NOT NULL CHECK (direction IN ('bullish','bearish','neutral')),
  trend_context text CHECK (trend_context IN ('uptrend','downtrend')),  -- close vs EMA 50
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (symbol_id, pattern_id, timeframe, candle_time)
);
CREATE INDEX signals_candle_time_idx ON signals (candle_time DESC);
CREATE INDEX signals_symbol_idx      ON signals (symbol_id, candle_time DESC);
CREATE INDEX signals_pattern_idx     ON signals (pattern_id, candle_time DESC);

CREATE TABLE scanner_runs (
  id              bigserial PRIMARY KEY,
  timeframe       text NOT NULL DEFAULT 'H1,H4,D1',
  trigger         text NOT NULL DEFAULT 'cron' CHECK (trigger IN ('cron','manual')),
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  status          text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','partial','error')),
  symbols_scanned int NOT NULL DEFAULT 0,
  candles_stored  int NOT NULL DEFAULT 0,
  signals_found   int NOT NULL DEFAULT 0,
  error           text
);
CREATE INDEX scanner_runs_started_idx ON scanner_runs (started_at DESC);

-- ── News (Phase 2) ─────────────────────────────────────────────────────
CREATE TABLE news_articles (
  id           bigserial PRIMARY KEY,
  slug         text NOT NULL UNIQUE,
  title        text NOT NULL,
  excerpt      text NOT NULL DEFAULT '',
  body_md      text NOT NULL,
  tags         text[] NOT NULL DEFAULT '{}',
  symbols      text[] NOT NULL DEFAULT '{}',
  sources      jsonb NOT NULL DEFAULT '[]',
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX news_published_idx ON news_articles (status, published_at DESC);

-- ── Affiliates ─────────────────────────────────────────────────────────
CREATE TABLE affiliate_links (
  id                serial PRIMARY KEY,
  broker            text NOT NULL UNIQUE,            -- slug used in /go/[broker]
  name              text NOT NULL,
  url               text,                            -- text-link tracking URL (redirect target)
  banner_src        text,                            -- network banner iframe src (network handles geo)
  banner_width      int,
  banner_height     int,
  blocked_countries text[] NOT NULL DEFAULT '{}',    -- ISO-2 codes where CTAs are hidden
  active            boolean NOT NULL DEFAULT true,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE affiliate_clicks (
  id         bigserial PRIMARY KEY,
  broker     text NOT NULL,
  kind       text NOT NULL DEFAULT 'link' CHECK (kind IN ('link','banner')),
  page_path  text,
  symbol     text,
  country    text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_clicks_created_idx ON affiliate_clicks (created_at DESC);

CREATE TABLE broker_content (
  id         serial PRIMARY KEY,
  broker     text NOT NULL,
  section    text NOT NULL,
  content_md text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broker, section)
);

-- ── Audience & settings ────────────────────────────────────────────────
CREATE TABLE subscribers (
  id         bigserial PRIMARY KEY,
  email      text NOT NULL UNIQUE,
  confirmed  boolean NOT NULL DEFAULT false,
  source     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

-- ── Seed data ──────────────────────────────────────────────────────────
-- Indices and oil need a paid Twelve Data plan, so they start inactive.
INSERT INTO symbols (symbol, provider_symbol, display_name, category, sort_order, active) VALUES
  ('EURUSD','EUR/USD','EUR/USD','forex',  10, true),
  ('GBPUSD','GBP/USD','GBP/USD','forex',  20, true),
  ('USDJPY','USD/JPY','USD/JPY','forex',  30, true),
  ('AUDUSD','AUD/USD','AUD/USD','forex',  40, true),
  ('USDCAD','USD/CAD','USD/CAD','forex',  50, true),
  ('USDCHF','USD/CHF','USD/CHF','forex',  60, true),
  ('NZDUSD','NZD/USD','NZD/USD','forex',  70, true),
  ('EURJPY','EUR/JPY','EUR/JPY','forex',  80, true),
  ('GBPJPY','GBP/JPY','GBP/JPY','forex',  90, true),
  ('EURGBP','EUR/GBP','EUR/GBP','forex', 100, true),
  ('XAUUSD','XAU/USD','Gold (XAU/USD)','metal',  110, true),
  ('XAGUSD','XAG/USD','Silver (XAG/USD)','metal',120, true),
  ('BTCUSD','BTC/USD','Bitcoin (BTC/USD)','crypto', 130, true),
  ('ETHUSD','ETH/USD','Ethereum (ETH/USD)','crypto',140, true),
  ('US30',  'DJI',    'US30 (Dow Jones)','index',   150, false),
  ('NAS100','NDX',    'NAS100 (Nasdaq 100)','index',160, false),
  ('SPX500','SPX',    'SPX500 (S&P 500)','index',   170, false),
  ('GER40', 'DAX',    'GER40 (DAX)','index',        180, false),
  ('UK100', 'FTSE',   'UK100 (FTSE 100)','index',   190, false),
  ('USOIL', 'WTI/USD','US Oil (WTI)','commodity',   200, false);

INSERT INTO patterns (slug, name, direction, candles, sort_order, description) VALUES
  ('bullish-hammer',     'Bullish Hammer',     'bullish', 1,  10, 'A small body near the top of the range with a long lower wick, after a decline. Sellers pushed price down but buyers drove it back up.'),
  ('inverted-hammer',    'Inverted Hammer',    'bullish', 1,  20, 'A small body near the bottom of the range with a long upper wick, after a decline. An early sign that buyers are testing higher prices.'),
  ('hanging-man',        'Hanging Man',        'bearish', 1,  30, 'Hammer-shaped candle that appears after a rise. The long lower wick shows sellers stepping in at the top of a move.'),
  ('shooting-star',      'Shooting Star',      'bearish', 1,  40, 'A small body near the low with a long upper wick, after a rise. Buyers pushed higher but sellers rejected the move.'),
  ('bullish-engulfing',  'Bullish Engulfing',  'bullish', 2,  50, 'A bullish candle whose body fully covers the previous bearish body, after a decline.'),
  ('bearish-engulfing',  'Bearish Engulfing',  'bearish', 2,  60, 'A bearish candle whose body fully covers the previous bullish body, after a rise.'),
  ('doji',               'Doji',               'neutral', 1,  70, 'Open and close are almost equal. The market is undecided.'),
  ('dragonfly-doji',     'Dragonfly Doji',     'bullish', 1,  80, 'A doji with a long lower wick and no upper wick. Lower prices were rejected.'),
  ('gravestone-doji',    'Gravestone Doji',    'bearish', 1,  90, 'A doji with a long upper wick and no lower wick. Higher prices were rejected.'),
  ('morning-star',       'Morning Star',       'bullish', 3, 100, 'Three-candle bottom: a long bearish candle, a small indecisive candle, then a strong bullish candle.'),
  ('evening-star',       'Evening Star',       'bearish', 3, 110, 'Three-candle top: a long bullish candle, a small indecisive candle, then a strong bearish candle.'),
  ('bullish-harami',     'Bullish Harami',     'bullish', 2, 120, 'A small bullish candle contained inside the previous long bearish body, after a decline.'),
  ('bearish-harami',     'Bearish Harami',     'bearish', 2, 130, 'A small bearish candle contained inside the previous long bullish body, after a rise.'),
  ('tweezer-top',        'Tweezer Top',        'bearish', 2, 140, 'Two candles with matching highs at the top of a rise: a bullish candle followed by a bearish one.'),
  ('tweezer-bottom',     'Tweezer Bottom',     'bullish', 2, 150, 'Two candles with matching lows at the bottom of a decline: a bearish candle followed by a bullish one.');

INSERT INTO affiliate_links (broker, name, url, banner_src, banner_width, banner_height, active) VALUES
  ('xm',        'XM',         NULL, 'https://images.pipaffiliates.com/f/b?g=1020&c=1333262', 120, 600, true),
  ('icmarkets', 'IC Markets', NULL, NULL, NULL, NULL, false);

INSERT INTO settings (key, value) VALUES
  ('news_auto_publish', 'false');
