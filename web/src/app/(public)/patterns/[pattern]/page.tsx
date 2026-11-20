import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrokers, getPattern, getPatterns, getSignals } from "@/lib/data";
import { GUIDES } from "@/lib/pattern-guides";
import { NOT_ADVICE, SITE } from "@/lib/site";
import PatternChart from "@/components/PatternChart";
import SignalTable, { DirectionBadge } from "@/components/SignalTable";
import BrokerAside from "@/components/BrokerAside";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

type Params = { params: Promise<{ pattern: string }> };

export async function generateStaticParams() {
  try {
    return (await getPatterns()).map((p) => ({ pattern: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pattern } = await params;
  const p = await getPattern(pattern);
  if (!p) return {};
  return {
    title: `${p.name} Candlestick Pattern: Meaning & Live Examples`,
    description: `${p.description} Learn how to identify the ${p.name.toLowerCase()} and see where it formed today on forex, gold and crypto.`,
    alternates: { canonical: `/patterns/${p.slug}` },
  };
}

export default async function PatternPage({ params }: Params) {
  const { pattern } = await params;
  const p = await getPattern(pattern);
  const g = GUIDES[pattern];
  if (!p || !g) notFound();
  const [signals, brokers, all] = await Promise.all([getSignals({ pattern: p.slug, limit: 25 }), getBrokers(), getPatterns()]);
  const path = `/patterns/${p.slug}`;
  const related = all.filter((x) => x.slug !== p.slug && x.direction === p.direction).slice(0, 4);

  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Patterns", item: `${SITE.url}/patterns` },
            { "@type": "ListItem", position: 2, name: p.name, item: `${SITE.url}${path}` },
          ],
        }}
      />
      <div className="page-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/patterns">Patterns</Link> <span>/</span> <span>{p.name}</span>
        </nav>
        <h1>{p.name} candlestick pattern</h1>
        <p>{g.summary}</p>
        <DirectionBadge direction={p.direction} />
      </div>

      <div className="guide-grid" style={{ marginTop: 24 }}>
        <article className="prose">
          <div className="chart-frame" style={{ marginBottom: 28 }}>
            <PatternChart bars={g.bars} patternBars={g.patternBars} width={560} height={260} title={`${p.name} illustration`} />
          </div>
          <h2>How to identify a {p.name.toLowerCase()}</h2>
          <ul>
            {g.identify.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h2>What it means</h2>
          <p>{g.meaning}</p>
          <h2>How traders use it</h2>
          <p>{g.howTradersUseIt}</p>
          <h2>How our scanner detects it</h2>
          <div className="rule-box">{g.scannerRule}</div>
          <h2>FAQ</h2>
          <div className="faq">
            {g.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </article>
        <aside>
          <div className="card">
            <h3>Related {p.direction} patterns</h3>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {related.map((r) => (
                <Link key={r.slug} href={`/patterns/${r.slug}`} className="small">
                  {r.name} →
                </Link>
              ))}
              <Link href="/patterns" className="small muted">
                All patterns
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Latest {p.name.toLowerCase()} occurrences</h2>
            <p className="muted small">Live from the scanner. {NOT_ADVICE}</p>
          </div>
          <Link href={`/scanner?pattern=${p.slug}`} className="btn btn-ghost btn-sm">
            Filter in scanner →
          </Link>
        </div>
        <div className="with-aside">
          <SignalTable signals={signals} brokers={brokers} from={path} />
          <BrokerAside brokers={brokers} />
        </div>
      </section>
    </div>
  );
}
