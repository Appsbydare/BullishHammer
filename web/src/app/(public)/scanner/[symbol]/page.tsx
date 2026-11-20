import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrokers, getSignals, getSymbol, getSymbols } from "@/lib/data";
import { getPublishedNews } from "@/lib/news/data";
import { shortDate } from "@/lib/format";
import { NOT_ADVICE, SITE } from "@/lib/site";
import SignalTable, { TradeLinks } from "@/components/SignalTable";
import BrokerAside from "@/components/BrokerAside";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

type Params = { params: Promise<{ symbol: string }> };

export async function generateStaticParams() {
  try {
    return (await getSymbols()).map((s) => ({ symbol: s.symbol.toLowerCase() }));
  } catch {
    return []; // DB unavailable at build: pages render on first request instead.
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { symbol } = await params;
  const s = await getSymbol(symbol);
  if (!s) return {};
  return {
    title: `${s.symbol} Candlestick Patterns Today (H1, H4, D1)`,
    description: `Latest candlestick patterns on ${s.display_name}: hammers, engulfing candles, dojis, stars and more on H1, H4 and D1, updated every hour.`,
    alternates: { canonical: `/scanner/${s.symbol.toLowerCase()}` },
  };
}

export default async function SymbolPage({ params }: Params) {
  const { symbol } = await params;
  const s = await getSymbol(symbol);
  if (!s) notFound();
  const [signals, symbols, brokers, news] = await Promise.all([
    getSignals({ symbol: s.symbol, limit: 100 }),
    getSymbols(),
    getBrokers(),
    getPublishedNews({ symbol: s.symbol, limit: 3 }),
  ]);
  const path = `/scanner/${s.symbol.toLowerCase()}`;

  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Scanner", item: `${SITE.url}/scanner` },
            { "@type": "ListItem", position: 2, name: s.display_name, item: `${SITE.url}${path}` },
          ],
        }}
      />
      <div className="page-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/scanner">Scanner</Link> <span>/</span> <span>{s.symbol}</span>
        </nav>
        <h1>{s.display_name} candlestick patterns</h1>
        <p>
          Patterns detected on closed {s.symbol} candles on H1, H4 and D1, newest first. The scanner checks every hour,
          a few minutes after each candle closes.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <TradeLinks symbol={s.symbol} brokers={brokers} from={path} />
        </div>
      </div>
      <div className="chips" style={{ margin: "16px 0 24px" }}>
        {symbols.map((x) => (
          <Link
            key={x.symbol}
            href={`/scanner/${x.symbol.toLowerCase()}`}
            className="chip"
            aria-current={x.symbol === s.symbol ? "page" : undefined}
          >
            {x.symbol}
          </Link>
        ))}
      </div>
      <div className="with-aside">
        <div>
          <SignalTable signals={signals} brokers={brokers} from={path} showSymbol={false} />
          <p className="notice" style={{ marginTop: 20 }}>
            {NOT_ADVICE}
          </p>
          {news.length > 0 && (
            <section className="section-tight">
              <h2>{s.symbol} news</h2>
              <div className="grid grid-3">
                {news.map((a) => (
                  <Link key={a.id} href={`/news/${a.slug}`} className="card card-link">
                    <p className="news-meta">{a.published_at && shortDate(a.published_at)}</p>
                    <h3 style={{ fontSize: "1rem", margin: 0 }}>{a.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
        <BrokerAside brokers={brokers} />
      </div>
    </div>
  );
}
