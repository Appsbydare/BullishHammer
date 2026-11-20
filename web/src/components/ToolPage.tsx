import Link from "next/link";
import JsonLd from "./JsonLd";
import { SITE } from "@/lib/site";

type Props = {
  path: string;
  title: string;
  intro: string;
  calculator: React.ReactNode;
  explainer: React.ReactNode;
  faq: { q: string; a: string }[];
  note?: string;
};

const CALC_NOTE =
  "Calculators are for education and planning only. Always confirm contract sizes, pip values and margin requirements with your broker before trading.";

/** Shared layout for calculator pages: tool on top, SEO explainer and FAQ underneath. */
export default function ToolPage({ path, title, intro, calculator, explainer, faq, note = CALC_NOTE }: Props) {
  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Tools", item: `${SITE.url}/tools` },
            { "@type": "ListItem", position: 2, name: title, item: `${SITE.url}${path}` },
          ],
        }}
      />
      <div className="page-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/tools">Tools</Link> <span>/</span> <span>{title}</span>
        </nav>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      <div style={{ marginTop: 16 }}>{calculator}</div>
      <section className="section prose">
        {explainer}
        <h2>FAQ</h2>
        <div className="faq">
          {faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="notice" style={{ marginTop: 24 }}>
          {note}
        </p>
      </section>
    </div>
  );
}
