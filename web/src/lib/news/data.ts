import "server-only";
import { query } from "@/lib/db";

export type Source = { title: string; url: string };
export type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  tags: string[];
  symbols: string[];
  sources: Source[];
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
export type ArticleSummary = Pick<Article, "id" | "slug" | "title" | "excerpt" | "tags" | "symbols" | "published_at">;

type Row = Omit<Article, "published_at" | "created_at" | "updated_at"> & {
  published_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

const iso = (d: string | Date | null) => (d ? new Date(d).toISOString() : null);

function toArticle(r: Row): Article {
  return {
    ...r,
    id: Number(r.id),
    sources: Array.isArray(r.sources) ? r.sources : [],
    published_at: iso(r.published_at),
    created_at: iso(r.created_at)!,
    updated_at: iso(r.updated_at)!,
  };
}

/** Published articles, newest first. Optionally only those tagged with a symbol. */
export async function getPublishedNews(opts: { limit?: number; symbol?: string } = {}): Promise<ArticleSummary[]> {
  const params: unknown[] = [opts.limit ?? 30];
  let where = "status = 'published'";
  if (opts.symbol) {
    params.push(opts.symbol.toUpperCase());
    where += ` AND symbols @> ARRAY[$2]::text[]`;
  }
  const rows = await query<ArticleSummary & { published_at: string | Date | null }>(
    `SELECT id, slug, title, excerpt, tags, symbols, published_at FROM news_articles
     WHERE ${where} ORDER BY published_at DESC LIMIT $1`,
    params,
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), published_at: iso(r.published_at) }));
}

export async function getPublishedArticle(slug: string): Promise<Article | null> {
  const [row] = await query<Row>("SELECT * FROM news_articles WHERE slug = $1 AND status = 'published'", [slug]);
  return row ? toArticle(row) : null;
}

export async function getArticleById(id: number): Promise<Article | null> {
  const [row] = await query<Row>("SELECT * FROM news_articles WHERE id = $1", [id]);
  return row ? toArticle(row) : null;
}
