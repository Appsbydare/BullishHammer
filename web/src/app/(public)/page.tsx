import Link from "next/link";
import { getBrokers, getPatterns, getScannerStatus, getSignals, getSymbols } from "@/lib/data";
import { getPublishedNews } from "@/lib/news/data";
import { GUIDES } from "@/lib/pattern-guides";
import { NOT_ADVICE, SITE } from "@/lib/site";
import { shortDate, timeAgo } from "@/lib/format";
import SignalTable from "@/components/SignalTable";
import PatternChart from "@/components/PatternChart";
import BrokerAside from "@/components/BrokerAside";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

const TOOLS = [
  { href: "/tools/position-size", title: "Position size calculator", text: "Find the right lot size from your balance, risk % and stop loss." },
  { href: "/tools/pip-value", title: "Pip value calculator", text: "See what one pip is worth in your account currency." },
  { href: "/tools/margin", title: "Margin calculator", text: "Work out the margin a trade needs at your leverage." },
  { href: "/tools/sessions", title: "Session clock", text: "See which forex sessions are open now, in your time zone." },
  { href: "/calendar", title: "Economic calendar", text: "Central bank decisions, CPI, jobs and GDP releases." },
  { href: "/brokers", title: "XM vs IC Markets", text: "Spreads, deposits, leverage and platforms compared." },
];

export default async function HomePage() {
  const [signals, status, patterns, symbols, brokers, news] = await Promise.all([
    getSignals({ limit: 8 }),
    getScannerStatus(),
    getPatterns(),
    getSymbols(),
    getBrokers(),
    getPublishedNews({ limit: 3 }),
  ]);
  const hero = GUIDES["bullish-hammer"];

  return (
    <>
      <JsonLd
        data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, description: SITE.description }}
      />
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Free candlestick scanner</p>
            <h1>
              Spot <span>hammers, engulfings and stars</span> across forex, gold and crypto
            </h1>
            <p className="hero-lead">
              We scan {symbols.length} markets on H1, H4 and D1 every hour and list every candlestick pattern that
              forms on a closed candle, with trend context.
            </p>
            <div className="hero-actions">
              <Link href="/scanner" className="btn btn-gold">
                Open the scanner
              </Link>
              <Link href="/patterns" className="btn btn-ghost">
                Learn the patterns
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <strong>{symbols.length}</strong>
                <span>markets scanned</span>
              </div>
              <div>
                <strong>{patterns.length}</strong>
                <span>patterns detected</span>
              </div>
              <div>
                <strong>{status.lastRun ? timeAgo(status.lastRun) : "—"}</strong>
                <span>last scan</span>
              </div>
            </div>
          </div>
          <div className="chart-frame" aria-hidden>
            <PatternChart bars={hero.bars} patternBars={hero.patternBars} width={420} height={260} title="Bullish hammer" />
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Latest patterns</h2>
              <p className="muted small">Closed candles only. {NOT_ADVICE}</p>
            </div>
            <Link href="/scanner" className="btn btn-ghost btn-sm">
              All signals →
            </Link>
          </div>
          <div className="with-aside">
            <SignalTable signals={signals} brokers={brokers} from="/" />
            <BrokerAside brokers={brokers} />
          </div>
        </div>
      </section>

      {news.length > 0 && (
        <section className="section-tight">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Market news</h2>
                <p className="muted small">The story that matters most for forex and gold traders, every morning.</p>
              </div>
              <Link href="/news" className="btn btn-ghost btn-sm">
                All news →
              </Link>
            </div>
            <div className="grid grid-3">
              {news.map((a) => (
                <Link key={a.id} href={`/news/${a.slug}`} className="card card-link">
                  <p className="news-meta">{a.published_at && shortDate(a.published_at)}</p>
                  <h3 style={{ fontSize: "1.05rem", margin: "0 0 6px" }}>{a.title}</h3>
                  <p className="muted small" style={{ margin: 0 }}>
                    {a.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Scan by market</h2>
          </div>
          <div className="chips">
            {symbols.map((s) => (
              <Link key={s.symbol} href={`/scanner/${s.symbol.toLowerCase()}`} className="chip">
                {s.display_name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Pattern library</h2>
              <p className="muted small">How each pattern forms, what it means and where it appeared recently.</p>
            </div>
            <Link href="/patterns" className="btn btn-ghost btn-sm">
              All patterns →
            </Link>
          </div>
          <div className="grid grid-3">
            {patterns.slice(0, 6).map((p) => {
              const g = GUIDES[p.slug];
              return (
                <Link key={p.slug} href={`/patterns/${p.slug}`} className="card card-link pattern-card">
                  {g && <PatternChart bars={g.bars} patternBars={g.patternBars} width={76} height={56} compact />}
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Free trading tools</h2>
          </div>
          <div className="grid grid-3">
            {TOOLS.map((t) => (
              <Link key={t.href} href={t.href} className="card card-link">
                <h3>{t.title}</h3>
                <p className="muted small" style={{ margin: 0 }}>
                  {t.text}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
