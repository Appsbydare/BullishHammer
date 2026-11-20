import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AFFILIATE_NOTE, RISK_WARNING, SITE } from "@/lib/site";

// Static info and legal pages. Review the wording with your own adviser before launch.

type Page = { title: string; description: string; body: React.ReactNode };

const UPDATED = "20 November 2026";

const PAGES: Record<string, Page> = {
  about: {
    title: "About Bullish Hammer",
    description: "What Bullish Hammer is, how the candlestick scanner works and how the site is funded.",
    body: (
      <>
        <p>
          Bullish Hammer is a free candlestick pattern scanner and set of trading calculators for forex, gold and
          crypto traders. Every hour, a few minutes after each candle closes, we check major forex pairs, gold and crypto on the H1, H4 and D1 timeframes for 15 classic candlestick patterns and publish what we find.
        </p>
        <h2>How the scanner works</h2>
        <p>
          The scanner only looks at closed candles, so a pattern never disappears after it has been listed. H4 and D1
          candles follow the same trading day as most MT5 brokers (the New York 5pm close), so the patterns line up with
          what you see on your own charts. Each detection notes whether price was above or below its 50-period moving
          average, which helps separate reversal setups from patterns that simply follow the trend. The exact rule for
          each pattern is published in the <Link href="/patterns">pattern library</Link>.
        </p>
        <h2>How we are funded</h2>
        <p>
          The site is free to use. We earn affiliate commissions when visitors open accounts with brokers we link to.
          See our <Link href="/affiliate-disclosure">affiliate disclosure</Link>.
        </p>
        <h2>What we are not</h2>
        <p>
          We are not a broker or a financial adviser, and nothing on this site is a recommendation to buy or sell. See
          the <Link href="/disclaimer">disclaimer</Link> and <Link href="/risk-warning">risk warning</Link>.
        </p>
      </>
    ),
  },
  contact: {
    title: "Contact",
    description: "How to get in touch with Bullish Hammer.",
    body: (
      <>
        <p>
          Questions, corrections or partnership enquiries: email{" "}
          <a href={`mailto:${SITE.contactEmail}`} style={{ color: "var(--gold-strong)" }}>
            {SITE.contactEmail}
          </a>
          .
        </p>
        <p>
          We cannot give personal trading advice or comment on individual trades, and we cannot help with broker
          account issues. Please contact your broker directly for those.
        </p>
      </>
    ),
  },
  disclaimer: {
    title: "Disclaimer",
    description: "Bullish Hammer provides educational information only and does not give financial advice.",
    body: (
      <>
        <p className="muted">Last updated {UPDATED}</p>
        <h2>Education only</h2>
        <p>
          All content on {SITE.domain}, including scanner results, pattern guides, calculators and articles, is general
          information for education. It is not investment, financial, tax or legal advice, and it does not take your
          personal circumstances into account.
        </p>
        <h2>Automated detections</h2>
        <p>
          Scanner results are produced automatically by software from third-party market data. Data can be delayed,
          incomplete or different from your broker&apos;s prices, and detection rules can miss patterns or flag
          patterns you would not consider valid. A detected pattern is not a signal to trade.
        </p>
        <h2>No guarantees</h2>
        <p>
          Past patterns and past performance do not predict future results. We make no guarantee about the accuracy,
          completeness or availability of the site and accept no liability for losses arising from its use.
        </p>
        <h2>Third-party links</h2>
        <p>
          We link to brokers and other websites we do not control. Read each provider&apos;s terms, risk disclosures
          and regulatory information before opening an account.
        </p>
      </>
    ),
  },
  "risk-warning": {
    title: "Risk warning",
    description: "Trading CFDs and leveraged products carries a high risk of losing money.",
    body: (
      <>
        <p className="muted">Last updated {UPDATED}</p>
        <p>
          <strong>{RISK_WARNING}</strong>
        </p>
        <h2>Leverage</h2>
        <p>
          Leverage magnifies both gains and losses. A small price move against a leveraged position can cause a loss
          larger than the margin you put up. Depending on your broker and jurisdiction, losses may exceed your deposit.
        </p>
        <h2>Volatility and gaps</h2>
        <p>
          Prices can move very quickly around news releases and market opens. Stop-loss orders are not guaranteed and
          may be filled at a worse price.
        </p>
        <h2>Crypto</h2>
        <p>
          Cryptocurrency CFDs are especially volatile and are not available to retail clients in every country.
        </p>
        <p>Only trade with money you can afford to lose, and seek independent advice if you are unsure.</p>
      </>
    ),
  },
  "affiliate-disclosure": {
    title: "Affiliate disclosure",
    description: "How Bullish Hammer earns money from broker affiliate links.",
    body: (
      <>
        <p className="muted">Last updated {UPDATED}</p>
        <p>{AFFILIATE_NOTE}</p>
        <p>
          Bullish Hammer takes part in affiliate programmes run by brokers, including XM and IC Markets. When you
          click a &quot;Trade on&quot; button or a broker banner and then open or fund an account, the broker may pay
          us a commission. Banners and links marked &quot;Sponsored&quot; or &quot;Advertisement&quot; are paid
          placements.
        </p>
        <p>
          Commissions do not affect scanner results, which are produced automatically by the same rules for every
          market. Broker availability, products and leverage differ by country; some brokers do not accept clients
          from certain countries, and we try to hide offers that do not apply to you.
        </p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    description: "What data Bullish Hammer collects and how it is used.",
    body: (
      <>
        <p className="muted">Last updated {UPDATED}</p>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Affiliate clicks:</strong> when you click a broker link or banner we record the broker, the page,
            the instrument (if any), your country (from your IP address, which we do not store) and the time.
          </li>
          <li>
            <strong>Server logs:</strong> our hosting provider (Vercel) keeps standard request logs, including IP
            addresses, for security and troubleshooting.
          </li>
          <li>
            <strong>Email (when available):</strong> if you sign up for our free indicator or newsletter, we store your
            email address and whether you confirmed it.
          </li>
        </ul>
        <h2>Cookies</h2>
        <p>
          The public site does not set tracking cookies. Broker banners are served by the broker&apos;s affiliate
          network, which may set its own cookies to attribute sign-ups; see the broker&apos;s privacy policy. The
          economic calendar is an embedded TradingView widget, which loads from TradingView&apos;s servers under their
          privacy policy. If we add analytics, we will ask for your consent first.
        </p>
        <h2>How we use data</h2>
        <p>
          To run and improve the site, measure which pages lead to broker sign-ups, and (if you subscribe) send you the
          emails you asked for. We do not sell personal data.
        </p>
        <h2>Your rights</h2>
        <p>
          You can ask us to access or delete data about you by emailing{" "}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
        </p>
      </>
    ),
  },
};

type Params = { params: Promise<{ page: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = PAGES[(await params).page];
  if (!p) return {};
  return { title: p.title, description: p.description, alternates: { canonical: `/${(await params).page}` } };
}

export default async function InfoPage({ params }: Params) {
  const p = PAGES[(await params).page];
  if (!p) notFound();
  return (
    <div className="container">
      <div className="page-head">
        <h1>{p.title}</h1>
      </div>
      <article className="legal">{p.body}</article>
    </div>
  );
}
