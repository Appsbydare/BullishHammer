import type { Metadata } from "next";
import Link from "next/link";
import { client } from "@/sanity/client";
import { defineQuery } from "next-sanity";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Topics | Bullish Hammer",
  description: "Browse Bullish Hammer coverage by category and topic.",
};

const TOPICS_QUERY = defineQuery(`{
  "categories": *[_type == "category" && defined(slug.current)]{
    title, description, "slug": slug.current,
    "count": count(*[_type == "article" && references(^._id) && status == "published" && defined(slug.current)])
  } | order(count desc),
  "tags": *[_type == "tag" && defined(slug.current)]{
    title, "slug": slug.current,
    "count": count(*[_type == "article" && references(^._id) && status == "published" && defined(slug.current)])
  } | order(count desc)
}`);

interface TopicsData {
  categories: { title: string; description?: string; slug: string; count: number }[];
  tags: { title: string; slug: string; count: number }[];
}

export default async function TopicsPage() {
  const data = await client.fetch<TopicsData>(TOPICS_QUERY);

  const categories = (data?.categories ?? []).filter((c) => c.count > 0);
  const tags = (data?.tags ?? []).filter((t) => t.count > 0);

  return (
    <div className="container">
      <header className="page-head">
        <span className="page-eyebrow">Explore</span>
        <h1 className="page-title">Topics</h1>
        <p className="page-lede">
          Every section and tag across our published coverage.
        </p>
      </header>

      <section className="topics-section">
        <h2 className="topics-heading">Sections</h2>
        {categories.length === 0 ? (
          <p className="empty-state">No categories with published articles yet.</p>
        ) : (
          <div className="topic-card-grid">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="topic-card">
                <span className="topic-card-count">{cat.count}</span>
                <span className="topic-card-title">{cat.title}</span>
                {cat.description && (
                  <span className="topic-card-desc">{cat.description}</span>
                )}
                <span className="topic-card-cta" aria-hidden="true">
                  Browse
                  <svg viewBox="0 0 16 16" className="topic-card-arrow">
                    <path d="M3 8h9M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="topics-section">
        <h2 className="topics-heading">Tags</h2>
        {tags.length === 0 ? (
          <p className="empty-state">No tags with published articles yet.</p>
        ) : (
          <div className="tag-cloud">
            {tags.map((tag) => (
              <Link key={tag.slug} href={`/topics/${tag.slug}`} className="tag-pill">
                {tag.title}
                <span className="tag-pill-count">{tag.count}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
