import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedNews } from "@/lib/news/data";
import { getBrokers } from "@/lib/data";
import { shortDate } from "@/lib/format";
import BrokerAside from "@/components/BrokerAside";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Forex and Gold News Today",
  description:
    "Daily forex and gold market news: what happened, how it moved XAU/USD and the major pairs, and what traders are watching next.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const [articles, brokers] = await Promise.all([getPublishedNews({ limit: 60 }), getBrokers()]);
  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Market news</p>
        <h1>Forex and gold news</h1>
        <p>
          One article each morning on the story that matters most for forex and gold traders, with the candlestick
          patterns our scanner found on the markets involved.
        </p>
      </div>
      <div className="with-aside" style={{ marginTop: 16 }}>
        <div>
          {articles.length === 0 ? (
            <div className="empty table-wrap">No articles yet. The first one is on its way.</div>
          ) : (
            <div className="news-list">
              {articles.map((a) => (
                <article key={a.id} className="news-item">
                  <p className="news-meta">
                    {a.published_at && <time dateTime={a.published_at}>{shortDate(a.published_at)}</time>}
                    {a.symbols.slice(0, 3).map((s) => (
                      <span key={s} className="badge badge-tf">
                        {s}
                      </span>
                    ))}
                  </p>
                  <h2>
                    <Link href={`/news/${a.slug}`}>{a.title}</Link>
                  </h2>
                  <p>{a.excerpt}</p>
                </article>
              ))}
            </div>
          )}
        </div>
        <BrokerAside brokers={brokers} />
      </div>
    </div>
  );
}
