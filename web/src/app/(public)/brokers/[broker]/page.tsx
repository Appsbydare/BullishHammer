import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BROKER_PAGES, FACTS, SECTIONS, getBrokerReview } from "@/lib/brokers";
import { getBrokers } from "@/lib/data";
import { SITE } from "@/lib/site";
import { shortDate } from "@/lib/format";
import Markdown from "@/components/Markdown";
import BrokerCta from "@/components/BrokerCta";
import BrokerAside from "@/components/BrokerAside";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;
export const dynamicParams = false;

type Params = { params: Promise<{ broker: string }> };

export function generateStaticParams() {
  return BROKER_PAGES.map((b) => ({ broker: b.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { broker } = await params;
  const page = BROKER_PAGES.find((b) => b.slug === broker);
  if (!page) return {};
  return {
    title: `${page.name} Review: Accounts, Spreads, Leverage and Regulation`,
    description: `${page.name} review for forex and gold traders: account types, spreads, commission, minimum deposit, leverage, platforms and regulation, with pros and cons.`,
    alternates: { canonical: `/brokers/${page.slug}` },
  };
}

export default async function BrokerReviewPage({ params }: Params) {
  const { broker } = await params;
  const review = await getBrokerReview(broker);
  if (!review) notFound();
  const brokers = await getBrokers();
  const { page, facts, sections } = review;
  const path = `/brokers/${page.slug}`;
  const other = BROKER_PAGES.find((b) => b.slug !== page.slug)!;

  const faq = [
    facts.min_deposit && { q: `What is the minimum deposit at ${page.name}?`, a: facts.min_deposit },
    facts.regulation && { q: `Is ${page.name} regulated?`, a: `${page.name} group licences: ${facts.regulation}. The entity you open an account with depends on where you live.` },
    facts.max_leverage && { q: `What leverage does ${page.name} offer?`, a: facts.max_leverage },
    facts.platforms && { q: `Which platforms can I use with ${page.name}?`, a: facts.platforms },
  ].filter(Boolean) as { q: string; a: string }[];

  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Brokers", item: `${SITE.url}/brokers` },
            { "@type": "ListItem", position: 2, name: `${page.name} review`, item: `${SITE.url}${path}` },
          ],
        }}
      />
      {faq.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }}
        />
      )}
      <div className="page-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/brokers">Brokers</Link> <span>/</span> <span>{page.name}</span>
        </nav>
        <h1>{page.name} review</h1>
        {sections.intro && <p>{sections.intro}</p>}
      </div>

      <div className="with-aside" style={{ marginTop: 16 }}>
        <div className="broker-review">
          <div className="card facts">
            <h2>Key facts</h2>
            <dl>
              {FACTS.filter((f) => facts[f.key]).map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{facts[f.key]}</dd>
                </div>
              ))}
            </dl>
            <p className="tiny muted" style={{ margin: "12px 0 0" }}>
              {review.lastChecked ? `Figures checked ${shortDate(review.lastChecked)}. ` : ""}
              Conditions depend on the {page.name} entity that serves your country. Always confirm on the broker&apos;s
              website.
            </p>
          </div>

          <BrokerCta broker={page.broker} name={page.name} brokers={brokers} from={path} />

          <div className="prose">
            {SECTIONS.filter((s) => s.heading && sections[s.key]).map((s) => (
              <section key={s.key}>
                <h2>{s.heading}</h2>
                <Markdown>{sections[s.key]}</Markdown>
              </section>
            ))}
          </div>

          {(sections.pros || sections.cons) && (
            <div className="grid grid-2 pros-cons">
              {sections.pros && (
                <div className="card pros">
                  <h3>Pros</h3>
                  <Markdown>{sections.pros}</Markdown>
                </div>
              )}
              {sections.cons && (
                <div className="card cons">
                  <h3>Cons</h3>
                  <Markdown>{sections.cons}</Markdown>
                </div>
              )}
            </div>
          )}

          {faq.length > 0 && (
            <section className="prose">
              <h2>FAQ</h2>
              <div className="faq">
                {faq.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <BrokerCta broker={page.broker} name={page.name} brokers={brokers} from={path} />

          <p className="muted small">
            Comparing brokers? See <Link href="/brokers">XM vs IC Markets</Link> or read our{" "}
            <Link href={`/brokers/${other.slug}`}>{other.name} review</Link>.
          </p>
        </div>
        <BrokerAside brokers={brokers} />
      </div>
    </div>
  );
}
