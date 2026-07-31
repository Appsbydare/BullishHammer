import Link from "next/link";

export const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800";

export interface ArticleCardData {
  _id: string;
  title: string;
  excerpt?: string;
  publishedAt?: string;
  slug?: { current: string } | string;
  category?: { title?: string; slug?: string } | null;
  author?: { name?: string } | null;
  coverImageUrl?: string;
}

export function resolveSlug(slug: ArticleCardData["slug"]): string {
  if (!slug) return "";
  return typeof slug === "string" ? slug : slug.current;
}

export function formatDate(value?: string): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Standard article card used across listing pages. */
export default function ArticleCard({ article }: { article: ArticleCardData }) {
  const slug = resolveSlug(article.slug);
  const href = slug ? `/article/${slug}` : "#";

  return (
    <article className="post-card">
      <Link href={href} className="post-card-media" tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.coverImageUrl || FALLBACK_IMG}
          alt=""
          loading="lazy"
        />
      </Link>
      <div className="post-card-body">
        {article.category?.title && (
          <span className="post-card-cat">{article.category.title}</span>
        )}
        <h3 className="post-card-title">
          <Link href={href}>{article.title}</Link>
        </h3>
        {article.excerpt && <p className="post-card-excerpt">{article.excerpt}</p>}
        <div className="post-card-meta">
          {article.author?.name && <span>{article.author.name}</span>}
          {article.publishedAt && <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>}
        </div>
      </div>
    </article>
  );
}
