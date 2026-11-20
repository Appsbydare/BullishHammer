import type { Metadata } from "next";
import Link from "next/link";
import EconomicCalendar from "@/components/EconomicCalendar";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Economic Calendar for Forex Traders",
  description:
    "Free economic calendar for forex and gold traders: central bank decisions, inflation, jobs and GDP releases for the US, eurozone, UK, Japan and more, in your time zone.",
  alternates: { canonical: "/calendar" },
};

const FAQ = [
  {
    q: "Which economic events move forex the most?",
    a: "Central bank rate decisions, US non-farm payrolls, inflation (CPI) releases and GDP figures usually cause the biggest moves in major pairs and gold.",
  },
  {
    q: "What do actual, forecast and previous mean?",
    a: "Forecast is the consensus estimate before the release, actual is the published figure and previous is the prior reading. Markets react to the gap between actual and forecast.",
  },
  {
    q: "Should I trade during high-impact news?",
    a: "Spreads widen and prices can gap during major releases, so stop losses may fill at worse prices. Many traders wait until the first reaction has settled.",
  },
];

export default function CalendarPage() {
  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="page-head">
        <p className="eyebrow">Calendar</p>
        <h1>Economic calendar</h1>
        <p>
          Medium and high impact releases for the major economies, shown in your time zone. Use the filters in the
          calendar to change the date range and importance.
        </p>
      </div>
      <div style={{ marginTop: 16 }}>
        <EconomicCalendar />
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Calendar data provided by TradingView.
        </p>
      </div>
      <section className="section prose">
        <h2>How to use the economic calendar</h2>
        <p>
          Check the calendar at the start of each week and again before you trade. High-impact events such as Federal
          Reserve decisions, non-farm payrolls and CPI can move EUR/USD, USD/JPY and gold by more than a normal day&apos;s
          range within minutes.
        </p>
        <p>
          Candlestick patterns that form right before a major release are less reliable, because the news can reverse
          price straight away. Patterns that form after the release, once the market has digested it, often say more.
          See the latest on the <Link href="/scanner">pattern scanner</Link> and check which sessions are open on the{" "}
          <Link href="/tools/sessions">session clock</Link>.
        </p>
        <h2>FAQ</h2>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
