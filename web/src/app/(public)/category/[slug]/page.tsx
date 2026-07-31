import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { client } from "@/sanity/client";
import { defineQuery } from "next-sanity";
import ArticleCard, { type ArticleCardData } from "@/components/ArticleCard";

const CATEGORY_QUERY = defineQuery(`
  *[_type == "category" && slug.current == $slug][0]{
    title,
    description,
    "slug": slug.current
  }
`);

const CATEGORY_ARTICLES_QUERY = defineQuery(`
  *[_type == "article"
    && status == "published"
    && defined(slug.current)
    && category->slug.current == $slug
  ] | order(publishedAt desc){
    _id, title, excerpt, publishedAt, slug,
    author->{name},
    category->{title, "slug": slug.current},
    "coverImageUrl": coverImage.asset->url
  }
`);

interface CategoryDoc {
  title: string;
  description?: string;
  slug: string;
}

export const revalidate = 300;

/** Pre-render a page for every category that exists. */
export async function generateStaticParams() {
  try {
    const slugs = await client.fetch<string[]>(
      defineQuery(`*[_type == "category" && defined(slug.current)].slug.current`)
    );
    return (slugs ?? []).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await client.fetch<CategoryDoc | null>(CATEGORY_QUERY, { slug });
  if (!category) return { title: "Category not found | Bullish Hammer" };

  return {
    title: `${category.title} | Bullish Hammer`,
    description: category.description || `${category.title} coverage and analysis from Bullish Hammer.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [category, articles] = await Promise.all([
    client.fetch<CategoryDoc | null>(CATEGORY_QUERY, { slug }),
    client.fetch<ArticleCardData[]>(CATEGORY_ARTICLES_QUERY, { slug }),
  ]);

  if (!category) return notFound();

  const [lead, ...rest] = articles ?? [];

  return (
    <div className="container">
      <header className="page-head">
        <span className="page-eyebrow">Category</span>
        <h1 className="page-title">{category.title}</h1>
        {category.description && <p className="page-lede">{category.description}</p>}
        <p className="page-count">
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="empty-state">No published articles in this category yet.</p>
      ) : (
        <>
          {lead && (
            <section className="lead-story">
              <ArticleCard article={lead} />
            </section>
          )}
          {rest.length > 0 && (
            <section className="post-grid">
              {rest.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
