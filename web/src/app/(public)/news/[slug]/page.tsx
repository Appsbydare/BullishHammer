import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedArticle, getPublishedNews } from "@/lib/news/data";
import { getBrokers, getSignals } from "@/lib/data";
import { NOT_ADVICE, RISK_WARNING, SITE } from "@/lib/site";
import { shortDate } from "@/lib/format";
import Markdown from "@/components/Markdown";
import SignalTable, { TradeLinks } from "@/components/SignalTable";
import BrokerAside from "@/components/BrokerAside";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    return (await getPublishedNews({ limit: 30 })).map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/news/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.excerpt,
      publishedTime: a.published_at ?? undefined,
      tags: a.tags,
      images: [{ url: `/og/news/${a.slug}`, width: 1200, height: 630, alt: a.title }],
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.excerpt, images: [`/og/news/${a.slug}`] },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a) notFound();
  const path = `/news/${a.slug}`;
  const [signals, brokers, more] = await Promise.all([
    a.symbols.length ? getSignals({ symbols: a.symbols, limit: 6 }) : Promise.resolve([]),
    getBrokers(),
    getPublishedNews({ limit: 4 }),
  ]);
  const related = more.filter((m) => m.slug !== a.slug).slice(0, 3);
  const mainSymbol = a.symbols[0] ?? "XAUUSD";
  const linked = brokers.filter((b) => b.url);

  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: a.title,
          description: a.excerpt,
          datePublished: a.published_at,
          dateModified: a.updated_at,
          image: [`${SITE.url}/og/news/${a.slug}`],
          mainEntityOfPage: `${SITE.url}${path}`,
          keywords: a.tags.join(", "),
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: `${SITE.url}/logo-mark.png` } },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "News", item: `${SITE.url}/news` },
            { "@type": "ListItem", position: 2, name: a.title, item: `${SITE.url}${path}` },
          ],
        }}
      />
      <div className="with-aside">
        <article className="article">
          <header className="page-head">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/news">News</Link> <span>/</span> <span>{a.published_at ? shortDate(a.published_at) : "Draft"}</span>
            </nav>
            <h1>{a.title}</h1>
            <p className="news-meta">
              {a.published_at && <time dateTime={a.published_at}>{shortDate(a.published_at)}</time>}
              <span>By the {SITE.name} desk</span>
              {a.symbols.map((s) => (
                <Link key={s} href={`/scanner/${s.toLowerCase()}`} className="badge badge-tf">
                  {s}
                </Link>
              ))}
            </p>
            <p>{a.excerpt}</p>
          </header>

          <div className="prose article-body">
            <Markdown>{a.body_md}</Markdown>
          </div>

          {signals.length > 0 && (
            <section className="section-tight">
              <div className="section-head">
                <div>
                  <h2>Latest patterns on {a.symbols.join(", ")}</h2>
                  <p className="muted small">Live from the scanner. {NOT_ADVICE}</p>
                </div>
              </div>
              <SignalTable signals={signals} brokers={brokers} from={path} />
            </section>
          )}

          {linked.length > 0 && (
            <div className="cta-box" style={{ marginTop: 8 }}>
              <div>
                <h3>Trade {mainSymbol} with a regulated broker</h3>
                <p>Open an account in minutes. Compare brokers on our <Link href="/brokers">XM vs IC Markets</Link> page.</p>
                <p className="cta-risk">{RISK_WARNING}</p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <TradeLinks symbol={mainSymbol} brokers={brokers} from={path} />
              </div>
            </div>
          )}

          {a.sources.length > 0 && (
            <section className="sources">
              <h2>Sources</h2>
              <ul>
                {a.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="nofollow noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="notice">
            This article was researched and written with AI from the sources listed above. It is general market
            commentary, not financial advice. {NOT_ADVICE}
          </p>

          {related.length > 0 && (
            <section className="section-tight">
              <h2>More news</h2>
              <div className="grid grid-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/news/${r.slug}`} className="card card-link">
                    <p className="news-meta">{r.published_at && shortDate(r.published_at)}</p>
                    <h3 style={{ fontSize: "1rem", margin: 0 }}>{r.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
        <BrokerAside brokers={brokers} />
      </div>
    </div>
  );
}
