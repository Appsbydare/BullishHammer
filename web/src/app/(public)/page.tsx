import Link from "next/link";
import { client } from "@/sanity/client";
import { defineQuery } from "next-sanity";
import { getMarketNews } from "@/lib/data-fetchers";
import { getFXSnapshot } from "@/lib/fx";
import FxRates from "@/components/FxRates";
import ArticleCard, {
  FALLBACK_IMG,
  resolveSlug,
  type ArticleCardData,
} from "@/components/ArticleCard";

const POSTS_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current) && status == "published"] | order(publishedAt desc)[0...13]{ 
    _id, title, slug, excerpt, publishedAt,
    author->{name},
    category->{title, "slug": slug.current},
    "coverImageUrl": coverImage.asset->url
  }`
);

export const revalidate = 60;

export default async function Home() {
  const [posts, fxSnapshot, news] = await Promise.all([
    client.fetch<ArticleCardData[]>(POSTS_QUERY, {}, { next: { revalidate: 60 } }),
    getFXSnapshot(),
    getMarketNews(),
  ]);

  const all = posts ?? [];
  const heroes = all.slice(0, 3);
  const feed = all.slice(3);

  return (
    <div className="container">
      {all.length === 0 ? (
        <p className="empty-state">
          No published articles yet. Generate and publish one from the admin dashboard.
        </p>
      ) : (
        <>
          <div className="section-title">Latest Updates</div>
          <section className="hero-grid">
            {heroes.map((post, i) => {
              const slug = resolveSlug(post.slug);
              return (
                <Link
                  key={post._id}
                  href={slug ? `/article/${slug}` : "#"}
                  className={`hero-card${i === 0 ? " hero-card-lead" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.coverImageUrl || FALLBACK_IMG} alt="" loading={i === 0 ? "eager" : "lazy"} />
                  <div className="hero-content">
                    <div className="hero-cat">{post.category?.title || "Analysis"}</div>
                    <h2 className="hero-title">{post.title}</h2>
                    <span className="read-more">Read More</span>
                  </div>
                </Link>
              );
            })}
          </section>
        </>
      )}

      <div className="two-col-layout">
        <div>
          {feed.length > 0 && (
            <>
              <div className="section-title">Hot Now</div>
              <div className="post-grid post-grid-compact">
                {feed.map((post) => (
                  <ArticleCard key={post._id} article={post} />
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="home-aside">
          <FxRates initial={fxSnapshot} />

          <div className="aside-block">
            <div className="section-title">Market News</div>
            {news && news.length > 0 ? (
              <ul className="news-list">
                {news.map((item: { uuid: string; title: string; url: string; source: string }) => (
                  <li key={item.uuid} className="news-item">
                    <h4>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    </h4>
                    <div className="news-meta">{item.source}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">News unavailable.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
