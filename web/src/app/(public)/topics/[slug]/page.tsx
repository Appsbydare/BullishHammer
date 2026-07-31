import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { client } from "@/sanity/client";
import { defineQuery } from "next-sanity";
import ArticleCard, { type ArticleCardData } from "@/components/ArticleCard";

export const revalidate = 300;

const TAG_QUERY = defineQuery(`
  *[_type == "tag" && slug.current == $slug][0]{ title, "slug": slug.current }
`);

const TAG_ARTICLES_QUERY = defineQuery(`
  *[_type == "article"
    && status == "published"
    && defined(slug.current)
    && $slug in tags[]->slug.current
  ] | order(publishedAt desc){
    _id, title, excerpt, publishedAt, slug,
    author->{name},
    category->{title, "slug": slug.current},
    "coverImageUrl": coverImage.asset->url
  }
`);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await client.fetch<{ title: string } | null>(TAG_QUERY, { slug });
  if (!tag) return { title: "Topic not found | Bullish Hammer" };

  return {
    title: `${tag.title} | Bullish Hammer`,
    description: `Articles tagged ${tag.title} from Bullish Hammer.`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tag, articles] = await Promise.all([
    client.fetch<{ title: string; slug: string } | null>(TAG_QUERY, { slug }),
    client.fetch<ArticleCardData[]>(TAG_ARTICLES_QUERY, { slug }),
  ]);

  if (!tag) return notFound();

  return (
    <div className="container">
      <header className="page-head">
        <span className="page-eyebrow">Topic</span>
        <h1 className="page-title">{tag.title}</h1>
        <p className="page-count">
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="empty-state">No published articles for this topic yet.</p>
      ) : (
        <section className="post-grid">
          {articles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </section>
      )}
    </div>
  );
}
