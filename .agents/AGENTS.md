# Bullish Hammer: project context

Affiliate site (XM, IC Markets) built around a candlestick pattern scanner. Scope and phases: `SCOPE.md`. Setup and architecture: `README.md`.

## Rules

- **Data flow:** the public site reads only from Neon. Only the scanner (`web/src/lib/scanner/`) calls the market-data provider. Never display raw prices publicly; candles are internal.
- **Styling:** plain CSS in `web/src/app/globals.css` (admin: `web/src/app/admin/admin.css`). No Tailwind. Dark theme tokens are CSS variables on `:root`.
- **Database:** Neon via `@neondatabase/serverless` (`web/src/lib/db.ts`, parameterised `query()`). Schema changes go in a new file under `web/db/migrations/`.
- **Admin auth:** HMAC-signed cookie (`web/src/lib/auth.ts`). Call `requireAdmin()` at the top of every admin page and server action.
- **Caching:** public pages use ISR (`export const revalidate`); the scanner calls `revalidatePath("/", "layout")` after each run. Keep visitor-specific logic (geo) client-side so pages stay static.
- **AI news:** `web/src/lib/news/generate.ts` (Claude + web search, strict `submit_article` tool). Keep the source-URL check and the cost stop. Markdown from AI or admin renders through `components/Markdown.tsx` (no raw HTML, no images).
- **Compliance:** keep the risk warning and affiliate disclosure in the footer; affiliate links use `rel="nofollow sponsored"`.
