# BullishHammer.com — Project Scope

## 1. Overview
**bullishhammer.com** is an affiliate website promoting **XM** and **IC Markets**. It drives organic traffic with free trading tools (mainly a candlestick pattern scanner) and daily AI-written market news. Every tool and article ends with a "Trade this on XM / IC Markets" call to action.

**Goals**
- Rank on Google for pattern, pair and tool keywords (e.g. "bullish hammer XAUUSD today", "forex position size calculator").
- Convert visitors into broker sign-ups via affiliate links.
- Build an email list (free MT5 indicator download in exchange for an email address).

---

## 2. Tech Stack
| Layer | Choice |
|---|---|
| Frontend / SSR | Next.js (App Router, TypeScript), Tailwind CSS |
| Hosting | Vercel (with Vercel Cron for scheduled jobs) |
| Database | Postgres: a dedicated `bullishhammer` schema inside an existing Supabase project (to avoid a new project), or Neon as a fallback |
| Scanner worker | Python script (runs on a Windows VPS with MT5, or as a cron job when using an API) |
| Market data | **Phase 1:** Twelve Data API (free tier, prototype only)<br>**Phase 2:** MT5 Python package (`MetaTrader5`) on a Windows VPS using an IC Markets/XM demo account |
| AI news | Claude API with the **web search tool** |
| Email | Resend or Brevo (signup + indicator delivery) |
| Analytics | Google Analytics 4 + Google Search Console |

---

## 3. Site Map
```
/                         Home
/scanner                  Pattern scanner (all results, filterable)
/scanner/[symbol]         Results for one symbol (e.g. /scanner/xauusd)
/patterns                 Pattern library
/patterns/[pattern]       Pattern guide + live occurrences (e.g. /patterns/bullish-hammer)
/news                     News list
/news/[slug]              News article
/tools/position-size      Position size calculator
/tools/pip-value          Pip value calculator
/tools/margin             Margin calculator
/tools/sessions           Forex market session clock
/calendar                 Economic calendar
/brokers                  XM vs IC Markets comparison
/brokers/xm               XM review
/brokers/ic-markets       IC Markets review
/free-indicator           MT5 hammer indicator download (email gate)
/about  /contact
/disclaimer  /risk-warning  /privacy  /affiliate-disclosure
/admin                    Admin panel (protected)
```

---

## 4. Features

### 4.1 Candlestick Pattern Scanner (core feature)
**Symbols (initial ~20):** EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, USDCHF, NZDUSD, EURJPY, GBPJPY, EURGBP, XAUUSD, XAGUSD, US30, NAS100, SPX500, GER40, UK100, USOIL, BTCUSD, ETHUSD *(configurable in admin)*.

**Timeframes:** H1, H4, D1.

**Patterns (initial):**
- Bullish Hammer, Inverted Hammer, Hanging Man, Shooting Star
- Bullish Engulfing, Bearish Engulfing
- Doji, Dragonfly Doji, Gravestone Doji
- Morning Star, Evening Star
- Bullish/Bearish Harami
- Tweezer Top / Tweezer Bottom

**Logic**
- Scan **closed candles only**.
- Schedule: H1 every hour (a few minutes after close), H4 every 4 hours, D1 once a day after the daily close.
- To save API calls: fetch H1 candles and build H4/D1 from them in code (Phase 1).
- Optional context filter: trend direction (e.g. price vs EMA 50) stored with each result so the UI can show "Hammer in downtrend = stronger signal".
- Store **results only** (no raw price redistribution on the public site).

**Data provider abstraction**
- A `DataProvider` interface with `get_candles(symbol, timeframe, count)`.
- Implementations: `TwelveDataProvider` (Phase 1), `MT5Provider` (Phase 2). Switch via environment variable.

**UI**
- Filter by symbol, timeframe, pattern, bullish/bearish, date.
- Table + card views; each result shows symbol, pattern, timeframe, candle time, direction, trend context, small candle illustration.
- CTA on each result: "Trade XAUUSD on XM / IC Markets".
- "Latest signals" widget on Home and in news articles.

### 4.2 Pattern Library
- One page per pattern: what it is, how to identify it, bullish/bearish meaning, how traders use it, a simple SVG illustration.
- "Latest occurrences" list pulled live from the scanner (keeps the pages fresh for SEO).

### 4.3 AI News (daily)
**Flow (Vercel Cron, once a day, e.g. 07:00 UTC):**
1. Call the Claude API with the **web search tool** enabled.
2. Prompt: find today's single most important financial/forex/gold story, research it across multiple reputable sources, then write an original article.
3. Article requirements:
   - Fully original wording (no copied sentences); 600–900 words.
   - Sections: summary, what happened, market impact on XAUUSD and the major pairs, what to watch next.
   - Insert the day's relevant scanner results (passed into the prompt from the DB).
   - List source links at the bottom.
   - Return structured JSON: `title, slug, excerpt, body_markdown, tags, symbols, sources[]`.
4. Save as **draft** (default) → admin reviews and publishes. Admin setting to toggle auto-publish.
5. Optional: generate a simple OG/featured image template (title + date + brand) with `@vercel/og`.

**Safeguards:** a disclaimer on every article, no duplicate topics within 3 days (check recent titles/tags before writing), and a token/cost limit per run.

### 4.4 Free Trading Tools
- **Position size calculator:** account balance, risk %, stop loss (pips), pair → lot size.
- **Pip value calculator:** pair, lot size, account currency.
- **Margin calculator:** pair, lot size, leverage.
- **Session clock:** Sydney / Tokyo / London / New York, with overlaps, in the user's local time.
- **Economic calendar:** embedded third-party widget (e.g. a free calendar widget) to start.
- All tools run client-side and work on mobile; each has an explanation section underneath for SEO.

### 4.5 Broker Pages
- XM and IC Markets reviews: account types, spreads, platforms, min deposit, regulation, pros/cons.
- XM vs IC Markets comparison table.
- Clear affiliate CTA buttons.
- Content editable from admin (figures change).

### 4.6 Affiliate Link System
- Links managed centrally in DB: `/go/xm`, `/go/icmarkets` redirect routes.
- Track clicks (source page, symbol, country, timestamp).
- **Geo-targeting:** detect visitor country (Vercel geo headers) and show only the brokers that accept that country; show a fallback message otherwise.

### 4.7 Lead Magnet
- `/free-indicator`: email form → sends download link for the MT5 hammer indicator (.ex5).
- Store subscribers; double opt-in.

### 4.8 Admin Panel (`/admin`)
- Login (Supabase Auth, single admin).
- News: list drafts, edit, publish/unpublish, "Generate now" button.
- Scanner: manage symbols/timeframes/patterns, view last run status and errors.
- Affiliate links: edit URLs, view click stats.
- Broker page content editing.
- Subscribers list + CSV export.
- Settings: auto-publish on/off.

---

## 5. Database (Postgres, schema `bullishhammer`)
| Table | Key columns |
|---|---|
| `symbols` | id, symbol, display_name, category (forex/metal/index/crypto/commodity), active |
| `patterns` | id, slug, name, direction (bullish/bearish/neutral), description |
| `signals` | id, symbol_id, pattern_id, timeframe, candle_time, direction, trend_context, created_at — unique(symbol_id, pattern_id, timeframe, candle_time) |
| `scanner_runs` | id, timeframe, started_at, finished_at, status, symbols_scanned, signals_found, error |
| `news_articles` | id, slug, title, excerpt, body_md, tags[], symbols[], sources (jsonb), status (draft/published), published_at, created_at |
| `affiliate_links` | id, broker, url, active |
| `affiliate_clicks` | id, broker, page_path, symbol, country, created_at |
| `broker_content` | id, broker, section, content_md, updated_at |
| `subscribers` | id, email, confirmed, source, created_at |
| `settings` | key, value |

Row-level security: public read on `signals`, `patterns`, `symbols`, published `news_articles`; all writes via the service role or the admin.

---

## 6. SEO
- Server-rendered pages, clean URLs, per-page meta title/description, Open Graph tags.
- Auto-generated `sitemap.xml` (scanner symbol pages, pattern pages, news) and `robots.txt`.
- Structured data: `NewsArticle` on news, `FAQPage` on tools/pattern pages, `BreadcrumbList`.
- Internal linking: news ↔ symbol scanner pages ↔ pattern pages ↔ broker pages.
- Fast Core Web Vitals (static/ISR pages, revalidate scanner pages after each run).

---

## 7. Compliance
- Affiliate disclosure on every page (footer + near CTAs).
- Risk warning banner/footer: "CFDs are complex instruments and come with a high risk of losing money…"
- "Not financial advice" note on scanner results and news.
- Geo-restricted broker CTAs (see 4.6).
- Cookie consent banner (GA4).
- Market data: only show detected patterns publicly; check the data provider's terms before displaying raw prices.

---

## 8. Design
- Dark trading theme (charcoal background, green = bullish, red = bearish, gold accent for brand).
- Logo concept: a hammer candlestick.
- Mobile-first; scanner table collapses to cards on mobile.

---

## 9. Phases
**Phase 1: MVP**
- Next.js project, layout, theme, legal pages.
- Scanner with Twelve Data (H1 fetch → H4/D1 built in code), signals table, scanner pages, pattern library.
- Position size, pip value and margin calculators.
- Affiliate redirect + click tracking.
- Deploy to Vercel, connect the domain, Search Console.

**Phase 2: Content**
- AI news (Claude API + web search), admin review flow.
- Broker reviews + comparison page.
- Session clock + economic calendar.
- Sitemap + structured data.

**Phase 3: Growth**
- Switch scanner to MT5 on VPS (`MT5Provider`).
- Free MT5 indicator + email list.
- Geo-targeted CTAs.
- Cross-links with tradingprogress.com.

---

## 10. Environment Variables
```
DATABASE_URL / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY
DATA_PROVIDER=twelvedata|mt5
TWELVE_DATA_API_KEY
ANTHROPIC_API_KEY
CRON_SECRET
RESEND_API_KEY
NEXT_PUBLIC_GA_ID
```

---

## 11. Out of Scope (for now)
- User accounts for visitors.
- Real-time/tick data or live charts.
- Trade signals with entry/SL/TP (patterns only, not advice).
- Mobile app.
