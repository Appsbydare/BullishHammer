import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { query } from "@/lib/db";
import { getSetting } from "@/lib/settings";

// Daily AI news: Claude researches the day's most important forex/gold story with the web
// search tool, then returns the article through the `submit_article` tool so we get
// structured JSON. Articles are saved as drafts unless auto-publish is on in /admin/news.

const MODEL = process.env.NEWS_MODEL || "claude-opus-5-5";
const MAX_COST_USD = Number(process.env.NEWS_MAX_COST_USD) || 2; // hard stop per run
const MAX_TURNS = 6; // API round trips (pause_turn continuations + validation retries)
const MAX_SEARCHES = 8; // per request

// USD per million tokens (Claude Opus 5.5) and per web search. Used for the cost estimate and the stop above.
const PRICE = { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2, search: 0.01 };

export type NewsRunResult = {
  runId: number;
  status: "success" | "skipped" | "error";
  articleId?: number;
  slug?: string;
  published?: boolean;
  costUsd: number;
  error?: string;
};

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  body_markdown: string;
  tags: string[];
  symbols: string[];
  sources: { title: string; url: string }[];
};

const SYSTEM = `You are the markets writer for Bullish Hammer (bullishhammer.com), a site for retail forex, gold and crypto traders that runs a free candlestick pattern scanner.

Each day you write one original news article about the single most important financial story for forex and gold traders.

How to work:
- Use web search to find today's most important story (central banks, inflation and jobs data, geopolitics, big moves in gold, the dollar or major pairs). Confirm the facts across at least three reputable sources (for example Reuters, Bloomberg, CNBC, the Financial Times, central bank websites, official statistics agencies).
- Report only facts you found in sources. Never invent figures, quotes or dates. If sources disagree, say so.
- Write entirely in your own words. Do not copy or closely paraphrase sentences from sources.

The article:
- 600 to 900 words of Markdown, written for retail traders: clear, factual, no hype.
- Do not include the title as a heading. Use these "##" sections in order: "Summary", "What happened", "Market impact", "What the scanner shows", "What to watch next".
- "Market impact" covers gold (XAU/USD) and the major currency pairs affected.
- "What the scanner shows" briefly mentions the most relevant candlestick patterns from the scanner results you are given, as context only. If none are relevant, say that no notable patterns formed on the affected markets.
- No trading advice: no buy or sell calls, entries, stop losses, targets or predictions presented as certain. Describe what traders are watching instead.
- Do not add a sources list or disclaimer to the body; the site adds both.

When the article is finished, call the submit_article tool once with it. Every URL in "sources" must be a page you actually found with web search.`;

function submitTool(symbols: string[]): Anthropic.Beta.BetaTool {
  return {
    name: "submit_article",
    description: "Submit the finished article. Call exactly once, after research and writing are complete.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "slug", "excerpt", "body_markdown", "tags", "symbols", "sources"],
      properties: {
        title: { type: "string", description: "Headline, 40 to 90 characters, no clickbait." },
        slug: { type: "string", description: "URL slug: lowercase words joined by hyphens, max 70 characters." },
        excerpt: { type: "string", description: "One or two sentence summary for listings and meta descriptions, max 200 characters." },
        body_markdown: { type: "string", description: "The article body in Markdown, 600 to 900 words, sections as described." },
        tags: { type: "array", items: { type: "string" }, description: "3 to 6 short lowercase topic tags, e.g. fed, inflation, gold." },
        symbols: { type: "array", items: { type: "string", enum: symbols }, description: "Scanner symbols the story affects most." },
        sources: {
          type: "array",
          description: "3 to 8 sources used, each a page found with web search.",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "url"],
            properties: { title: { type: "string" }, url: { type: "string" } },
          },
        },
      },
    },
  };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
}

const words = (md: string) => md.replace(/[#*_>`\[\]()-]/g, " ").split(/\s+/).filter(Boolean).length;

/** Checks the tool input. `seen` is everything Claude read this run, to reject source URLs it never found. */
function validate(input: unknown, symbols: string[], seen: string): { ok: true; draft: Draft } | { ok: false; error: string } {
  const d = input as Partial<Draft> | null;
  const str = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  if (!d || !str(d.title) || !str(d.excerpt) || !str(d.body_markdown) || !Array.isArray(d.sources)) {
    return { ok: false, error: "Missing title, excerpt, body_markdown or sources. Submit the complete article again." };
  }
  const n = words(d.body_markdown!);
  if (n < 450 || n > 1200) return { ok: false, error: `The body is ${n} words; it must be 600 to 900 words. Revise and submit again.` };
  const sources = d.sources
    .filter((s) => s && str(s.url) && /^https:\/\//.test(s.url) && seen.includes(s.url))
    .map((s) => ({ title: String(s.title || s.url).trim().slice(0, 200), url: s.url.trim() }));
  const unique = [...new Map(sources.map((s) => [s.url, s])).values()];
  if (unique.length < 2) {
    return { ok: false, error: "Fewer than two sources match pages you found with web search. List the exact URLs of the pages you used." };
  }
  return {
    ok: true,
    draft: {
      title: d.title!.trim().slice(0, 140),
      slug: slugify(str(d.slug) ? d.slug! : d.title!) || slugify(d.title!),
      excerpt: d.excerpt!.trim().slice(0, 300),
      body_markdown: d.body_markdown!.trim(),
      tags: (Array.isArray(d.tags) ? d.tags : []).map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 8),
      symbols: (Array.isArray(d.symbols) ? d.symbols : []).filter((s) => symbols.includes(s)),
      sources: unique.slice(0, 10),
    },
  };
}

async function buildBrief(): Promise<{ text: string; symbols: string[] }> {
  const [symbols, recent, signals] = await Promise.all([
    query<{ symbol: string; display_name: string }>("SELECT symbol, display_name FROM symbols WHERE active ORDER BY sort_order"),
    query<{ title: string; tags: string[] }>(
      "SELECT title, tags FROM news_articles WHERE created_at > now() - interval '3 days' ORDER BY created_at DESC",
    ),
    query<{ symbol: string; timeframe: string; name: string; direction: string; trend_context: string | null; candle_time: Date | string }>(
      `SELECT s.symbol, g.timeframe, p.name, g.direction, g.trend_context, g.candle_time
       FROM signals g JOIN symbols s ON s.id = g.symbol_id JOIN patterns p ON p.id = g.pattern_id
       WHERE g.candle_time > now() - interval '36 hours' AND g.timeframe IN ('H4','D1') AND s.active
       ORDER BY CASE g.timeframe WHEN 'D1' THEN 0 ELSE 1 END, g.candle_time DESC LIMIT 60`,
    ),
  ]);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const recentText = recent.length
    ? recent.map((r) => `- ${r.title} [${r.tags.join(", ")}]`).join("\n")
    : "- (none)";
  const signalText = signals.length
    ? signals
        .map((g) => {
          const trend = g.trend_context === "uptrend" ? "price above EMA 50" : g.trend_context === "downtrend" ? "price below EMA 50" : "trend n/a";
          return `- ${g.symbol} ${g.timeframe}: ${g.name} (${g.direction}), candle opened ${new Date(g.candle_time).toISOString().slice(0, 16).replace("T", " ")} UTC, ${trend}`;
        })
        .join("\n")
    : "- (no H4 or D1 patterns in the last 36 hours)";
  const text = `Today is ${today} (UTC).

Articles published in the last 3 days. Pick a different story; only cover the same topic if there is a major new development, and then focus on what is new:
${recentText}

Scanner results from the last 36 hours (H4 and D1 closed candles):
${signalText}

Symbols you can tag: ${symbols.map((s) => s.symbol).join(", ")}.

Research and write today's article, then call submit_article.`;
  return { text, symbols: symbols.map((s) => s.symbol) };
}

/**
 * Serialized web search/fetch results and citations from the conversation. Source URLs must appear
 * here, so a URL Claude wrote from memory (or made up) is rejected.
 */
function retrievedText(messages: Anthropic.Beta.BetaMessageParam[]): string {
  const parts: string[] = [];
  for (const m of messages) {
    if (m.role !== "assistant" || typeof m.content === "string") continue;
    for (const b of m.content) {
      if (b.type.endsWith("_tool_result")) parts.push(JSON.stringify(b));
      else if (b.type === "text" && "citations" in b && b.citations) parts.push(JSON.stringify(b.citations));
    }
  }
  return parts.join("\n");
}

function cost(u: Anthropic.Beta.BetaUsage): number {
  return (
    (u.input_tokens * PRICE.input +
      (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite +
      (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead +
      u.output_tokens * PRICE.output) /
      1e6 +
    (u.server_tool_use?.web_search_requests ?? 0) * PRICE.search
  );
}

export async function generateNews(trigger: "cron" | "manual"): Promise<NewsRunResult> {
  // Cron may retry; never write two articles within 20 hours unless an admin asks for one.
  if (trigger === "cron") {
    const [recent] = await query<{ n: string }>(
      "SELECT count(*) AS n FROM news_articles WHERE created_at > now() - interval '20 hours'",
    );
    if (Number(recent.n) > 0) {
      const [run] = await query<{ id: string }>(
        "INSERT INTO news_runs (trigger, status, finished_at, model, error) VALUES ($1, 'skipped', now(), $2, 'An article was already created in the last 20 hours.') RETURNING id",
        [trigger, MODEL],
      );
      return { runId: Number(run.id), status: "skipped", costUsd: 0, error: "Already generated today." };
    }
  }

  const [run] = await query<{ id: string }>("INSERT INTO news_runs (trigger, model) VALUES ($1, $2) RETURNING id", [trigger, MODEL]);
  const runId = Number(run.id);
  const totals = { input: 0, output: 0, searches: 0, cost: 0 };

  const finish = async (status: "success" | "error", articleId: number | null, error: string | null) => {
    await query(
      `UPDATE news_runs SET finished_at = now(), status = $2, article_id = $3, input_tokens = $4, output_tokens = $5,
         web_searches = $6, cost_usd = $7, error = $8 WHERE id = $1`,
      [runId, status, articleId, totals.input, totals.output, totals.searches, totals.cost.toFixed(4), error],
    );
  };

  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");
    const brief = await buildBrief();
    const client = new Anthropic();
    const tools: Anthropic.Beta.BetaToolUnion[] = [
      { type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES },
      submitTool(brief.symbols),
    ];
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: brief.text }];
    let draft: Draft | null = null;
    let streamRetries = 0;

    for (let turn = 0; turn < MAX_TURNS && !draft; turn++) {
      let msg: Anthropic.Beta.BetaMessage;
      try {
        const stream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 64000,
          system: SYSTEM,
          thinking: { type: "adaptive" },
          output_config: { effort: "high" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default", // re-run on a fallback model if the request is declined
          tools,
          messages,
        });
        msg = await stream.finalMessage();
        streamRetries = 0;
      } catch (err) {
        // API errors (auth, rate limit, overload after SDK retries) are final. A dropped
        // connection or unparseable tool input gets two more tries.
        if (err instanceof Anthropic.APIError || streamRetries++ >= 2) throw err;
        turn--;
        continue;
      }

      const u = msg.usage;
      totals.input += u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
      totals.output += u.output_tokens;
      totals.searches += u.server_tool_use?.web_search_requests ?? 0;
      totals.cost += cost(u);
      if (totals.cost > MAX_COST_USD) throw new Error(`Stopped: cost limit of $${MAX_COST_USD} reached.`);

      if (msg.stop_reason === "refusal") throw new Error("The model declined the request.");
      if (msg.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: msg.content });
        continue;
      }
      const call = msg.content.find(
        (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === "submit_article",
      );
      if (!call) {
        if (msg.stop_reason === "max_tokens") throw new Error("Hit max_tokens before the article was submitted.");
        messages.push({ role: "assistant", content: msg.content });
        messages.push({ role: "user", content: "Please call submit_article now with the finished article." });
        continue;
      }
      if (msg.stop_reason === "max_tokens") throw new Error("Article was cut off at max_tokens.");

      const v = validate(call.input, brief.symbols, retrievedText([...messages, { role: "assistant", content: msg.content }]));
      if (v.ok) {
        draft = v.draft;
        break;
      }
      messages.push({ role: "assistant", content: msg.content });
      messages.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: call.id, is_error: true, content: v.error }],
      });
    }

    if (!draft) throw new Error(`No valid article after ${MAX_TURNS} attempts.`);

    const publish = await getSetting<boolean>("news_auto_publish", false);
    const [clash] = await query<{ n: string }>("SELECT count(*) AS n FROM news_articles WHERE slug = $1", [draft.slug]);
    const slug = Number(clash.n) > 0 ? `${draft.slug}-${new Date().toISOString().slice(0, 10)}-${runId}` : draft.slug;

    const [row] = await query<{ id: string }>(
      `INSERT INTO news_articles (slug, title, excerpt, body_md, tags, symbols, sources, status, published_at, model)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10) RETURNING id`,
      [
        slug,
        draft.title,
        draft.excerpt,
        draft.body_markdown,
        draft.tags,
        draft.symbols,
        JSON.stringify(draft.sources),
        publish ? "published" : "draft",
        publish ? new Date().toISOString() : null,
        MODEL,
      ],
    );
    const articleId = Number(row.id);
    await finish("success", articleId, null);
    return { runId, status: "success", articleId, slug, published: publish, costUsd: totals.cost };
  } catch (err) {
    const apiMessage =
      err instanceof Anthropic.APIError
        ? (err.error as { error?: { message?: string } } | undefined)?.error?.message
        : undefined;
    const message =
      err instanceof Anthropic.APIError
        ? `Claude API ${err.status ?? ""}: ${apiMessage ?? err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    await finish("error", null, message.slice(0, 1000));
    return { runId, status: "error", costUsd: totals.cost, error: message };
  }
}
