import { client } from "@/sanity/client";
import { defineQuery, type SanityDocument } from "next-sanity";
import { getFXRates, getMarketNews } from "@/lib/data-fetchers";

const POSTS_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current) && status != "draft"] | order(publishedAt desc)[0...10]{ 
    _id, title, slug, excerpt, publishedAt,
    author->{name},
    category->{title},
    "coverImageUrl": coverImage.asset->url
  }`
);

const FALLBACK_IMG = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800";

export default async function Home() {
  const postsPromise = client.fetch<SanityDocument[]>(POSTS_QUERY, {}, { next: { revalidate: 60 } });
  const fxRatesPromise = getFXRates();
  const newsPromise = getMarketNews();

  const [posts, fxRates, news] = await Promise.all([postsPromise, fxRatesPromise, newsPromise]);

  return (
    <div className="container">
      <div className="section-title">Latest Updates</div>
      <section className="hero-grid">
        {posts && posts.slice(0, 3).map((post) => (
          <div key={post._id} className="hero-card">
            <img
              src={(post.coverImageUrl as string) || FALLBACK_IMG}
              alt={post.title as string}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
            <div className="hero-content">
              <div className="hero-cat">{(post.category as any)?.title || 'Analysis'}</div>
              <h2 className="hero-title">{post.title as string}</h2>
              <a href={`/article/${(post.slug as { current: string }).current}`} className="read-more">Read More</a>
            </div>
          </div>
        ))}
        {posts && posts.length < 3 && Array(3 - posts.length).fill(0).map((_, i) => (
          <div key={`placeholder-${i}`} className="hero-card">
            <img src={FALLBACK_IMG} alt="Stock Market" />
            <div className="hero-content">
              <div className="hero-cat">Market Watch</div>
              <h2 className="hero-title">Fed Signals Rate Shifts Incoming</h2>
              <a href="#" className="read-more">Read More</a>
            </div>
          </div>
        ))}
      </section>

      <div className="two-col-layout">
        <div>
          <div className="section-title">Hot Now</div>
          <div className="list-articles">
            {posts && posts.map((post) => {
              const date = new Date(post.publishedAt as string);
              const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              return (
                <div key={post._id} className="list-article">
                  <div className="list-time">{timeString}</div>
                  {post.coverImageUrl && (
                    <div style={{ width: '80px', flexShrink: 0 }}>
                      <img
                        src={post.coverImageUrl as string}
                        alt={post.title as string}
                        style={{ width: '80px', height: '54px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="list-title">
                      <a href={`/article/${(post.slug as { current: string }).current}`}>{post.title as string}</a>
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                      {post.excerpt as string}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside>
          <div className="widget">
            <h3>Live FX Rates</h3>
            {fxRates ? (
              <div>
                {Object.entries(fxRates).map(([pair, rate]) => (
                  <div key={pair} className="fx-rate">
                    <span>{pair}/USD</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{Number(rate).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>FX rates unavailable.</p>
            )}
          </div>

          <div className="widget" style={{ background: 'transparent', padding: '0', border: 'none' }}>
            <div className="section-title">Market News</div>
            {news && news.length > 0 ? (
              news.map((item: any) => (
                <div key={item.uuid} className="news-item">
                  <h4><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h4>
                  <div className="news-meta">{item.source}</div>
                </div>
              ))
            ) : (
              <p>News unavailable.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
