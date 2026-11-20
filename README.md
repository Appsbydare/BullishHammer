# Bullish Hammer

Affiliate site for XM and IC Markets, built around a free candlestick pattern scanner, a pattern library and trading calculators. Full scope: [SCOPE.md](SCOPE.md).

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router, TypeScript), plain CSS (`web/src/app/globals.css`) |
| Database | Neon Postgres, project **BullishHammer** (`noisy-resonance-29610544`, AWS us-east-1) |
| Market data | Twelve Data free plan (H1 candles), stored in Neon |
| AI news | Claude API (`claude-opus-5-5`) with the web search tool |
| Hosting / cron | Vercel (Pro) with Vercel Cron |

The public site reads **only from Neon**. The scanner is the only thing that talks to the data provider.

## How the scanner works

`/api/cron/scan` runs hourly at :05 (`web/vercel.json`):

1. For each active symbol, fetch new closed H1 candles from Twelve Data (a full ~5000-candle backfill the first time) and upsert them into `candles`.
2. Build H4 and D1 candles from H1, aligned to broker server time (New York 5pm close, UTC+2/+3), so they match MT5 charts.
3. Detect 15 patterns on the latest closed candles (`web/src/lib/scanner/detect.ts`) and insert new rows into `signals`, with EMA-50 trend context.
4. Log the run in `scanner_runs` and revalidate the site.

The free Twelve Data plan allows 8 calls a minute, so a run over 13 symbols takes about 75 seconds. Indices, oil and silver need a paid plan; they are in the `symbols` table but inactive (toggle in `/admin/symbols`).

## How the AI news works

`/api/cron/news` runs daily at 07:00 UTC (`web/src/lib/news/generate.ts`):

1. Builds a brief: today's date, article titles and tags from the last 3 days (to avoid repeats), and H4/D1 scanner results from the last 36 hours.
2. Claude researches with web search (up to 8 searches), writes a 600 to 900 word article and returns it through a strict `submit_article` tool.
3. The article is checked: word count, and every source URL must appear in the search results Claude actually received. Failures go back to Claude to fix.
4. Saved as a draft (or published if auto-publish is on in `/admin/news`). Each run is logged in `news_runs` with tokens and estimated cost, with a hard stop at `NEWS_MAX_COST_USD` (default $2).

The cron run skips if an article was already created in the last 20 hours. **Generate article now** in `/admin/news` always runs.

## Local development

```bash
npm install
cp web/.env.example web/.env.local   # fill in values
npm run db:migrate                   # applies web/db/migrations/*.sql
npm run dev                          # http://localhost:3000
```

Trigger a scan locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/scan
```

or use **Run scanner now** in `/admin`.

## Deploying to Vercel

- Root Directory: `web`. `web/vercel.json` holds the cron schedule.
- Set every variable from `web/.env.example` in Project → Settings → Environment Variables.
- Hourly cron jobs need the Vercel Pro plan.

## Routes

| Route | Purpose |
|---|---|
| `/` | Home: latest patterns, markets, library, tools |
| `/scanner`, `/scanner/[symbol]` | Scanner results (filters run client-side) |
| `/patterns`, `/patterns/[pattern]` | Pattern guides with live occurrences |
| `/tools/position-size`, `/tools/pip-value`, `/tools/margin` | Calculators |
| `/tools/sessions` | Forex session clock (client-side, local time) |
| `/calendar` | Economic calendar (TradingView widget) |
| `/news`, `/news/[slug]` | AI news articles; share image at `/og/news/[slug]` |
| `/brokers`, `/brokers/xm`, `/brokers/ic-markets` | Comparison and reviews (content in `broker_content`, edited in `/admin/brokers`) |
| `/about`, `/contact`, `/disclaimer`, `/risk-warning`, `/privacy`, `/affiliate-disclosure` | Info and legal |
| `/go/[broker]` | Affiliate redirect with click logging |
| `/admin` | Scanner runs, news drafts and auto-publish, symbols, affiliate links and click stats, broker review content |
| `/api/cron/scan` | Hourly scanner (Bearer `CRON_SECRET`) |
| `/api/cron/news` | Daily AI article (Bearer `CRON_SECRET`) |
| `/api/track-click`, `/api/geo` | Banner click logging, visitor country |

## Database changes

Add a new numbered file in `web/db/migrations/` and run `npm run db:migrate`. Never edit a migration that has already been applied.
