import type { Metadata } from "next";
import Link from "next/link";
import { FACTS, getBrokerReviews } from "@/lib/brokers";
import { getBrokers } from "@/lib/data";
import { AFFILIATE_NOTE, SITE } from "@/lib/site";
import Markdown from "@/components/Markdown";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "XM vs IC Markets: Which Broker Is Better?",
  description:
    "XM vs IC Markets compared side by side: minimum deposit, spreads, commission, leverage, platforms and regulation, and which suits your trading.",
  alternates: { canonical: "/brokers" },
};

export default async function BrokersPage() {
  const [reviews, brokers] = await Promise.all([getBrokerReviews(), getBrokers()]);
  const linkFor = (broker: string) => brokers.find((b) => b.broker === broker && b.url);

  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Broker reviews",
          itemListElement: reviews.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE.url}/brokers/${r.page.slug}`,
            name: `${r.page.name} review`,
          })),
        }}
      />
      <div className="page-head">
        <p className="eyebrow">Brokers</p>
        <h1>XM vs IC Markets</h1>
        <p>
          Both brokers offer MetaTrader 4 and 5 with forex, gold and crypto CFDs. XM suits small starting balances and
          simple, commission-free pricing. IC Markets suits active traders who want raw spreads.
        </p>
      </div>

      <div className="table-wrap compare-wrap" style={{ marginTop: 16 }}>
        <table className="compare">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Feature</span>
              </th>
              {reviews.map((r) => (
                <th key={r.page.slug} scope="col">
                  <Link href={`/brokers/${r.page.slug}`}>{r.page.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTS.map((f) => (
              <tr key={f.key}>
                <th scope="row">{f.label}</th>
                {reviews.map((r) => (
                  <td key={r.page.slug}>{r.facts[f.key] || "—"}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">
                <span className="sr-only">Links</span>
              </th>
              {reviews.map((r) => {
                const link = linkFor(r.page.broker);
                return (
                  <td key={r.page.slug}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/brokers/${r.page.slug}`} className="btn btn-ghost btn-sm">
                        Read review
                      </Link>
                      {link && (
                        <a
                          className="btn btn-gold btn-sm"
                          href={`/go/${link.broker}?from=${encodeURIComponent("/brokers")}`}
                          rel="nofollow sponsored noopener"
                          target="_blank"
                        >
                          Visit {r.page.name}
                        </a>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="tiny muted" style={{ marginTop: 10 }}>
        Conditions depend on the broker entity that serves your country and can change. Always confirm on the
        broker&apos;s website. {AFFILIATE_NOTE}
      </p>

      <section className="section grid grid-2">
        {reviews.map((r) => (
          <div key={r.page.slug} className="card">
            <h2 style={{ marginTop: 0 }}>{r.page.name}</h2>
            {r.sections.verdict && (
              <div className="prose">
                <Markdown>{r.sections.verdict}</Markdown>
              </div>
            )}
            <Link href={`/brokers/${r.page.slug}`} className="btn btn-ghost btn-sm">
              Full {r.page.name} review →
            </Link>
          </div>
        ))}
      </section>

      <section className="prose" style={{ paddingBottom: 48 }}>
        <h2>How to choose</h2>
        <ul>
          <li>
            <strong>Small account or first live account:</strong> a low minimum deposit and commission-free pricing keep
            things simple.
          </li>
          <li>
            <strong>Frequent trading or scalping:</strong> raw spreads plus a fixed commission are usually cheaper per
            trade once you trade often.
          </li>
          <li>
            <strong>Regulation:</strong> check which entity you will be onboarded with. Offshore entities offer higher
            leverage but weaker investor protection.
          </li>
          <li>
            <strong>Platform:</strong> both offer MT4 and MT5, so the patterns on our <Link href="/scanner">scanner</Link>{" "}
            line up with your charts.
          </li>
        </ul>
      </section>
    </div>
  );
}
