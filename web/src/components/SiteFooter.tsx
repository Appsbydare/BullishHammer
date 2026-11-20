import Link from "next/link";
import Image from "next/image";
import { AFFILIATE_NOTE, NOT_ADVICE, RISK_WARNING, SITE } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <Image src="/logo-mark.png" alt="" width={36} height={36} />
              <span className="brand-name">
                Bullish<span>Hammer</span>
              </span>
            </Link>
            <p>{SITE.tagline}. Patterns are detected automatically on closed candles every hour.</p>
          </div>
          <div className="footer-col">
            <h4>Scanner</h4>
            <Link href="/scanner">All signals</Link>
            <Link href="/scanner/xauusd">Gold (XAU/USD)</Link>
            <Link href="/scanner/eurusd">EUR/USD</Link>
            <Link href="/scanner/btcusd">Bitcoin</Link>
          </div>
          <div className="footer-col">
            <h4>Learn & tools</h4>
            <Link href="/patterns">Pattern library</Link>
            <Link href="/tools/position-size">Position size calculator</Link>
            <Link href="/tools/pip-value">Pip value calculator</Link>
            <Link href="/tools/margin">Margin calculator</Link>
            <Link href="/tools/sessions">Session clock</Link>
            <Link href="/calendar">Economic calendar</Link>
          </div>
          <div className="footer-col">
            <h4>News & brokers</h4>
            <Link href="/news">Market news</Link>
            <Link href="/brokers">XM vs IC Markets</Link>
            <Link href="/brokers/xm">XM review</Link>
            <Link href="/brokers/ic-markets">IC Markets review</Link>
          </div>
          <div className="footer-col">
            <h4>Site</h4>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/risk-warning">Risk warning</Link>
            <Link href="/disclaimer">Disclaimer</Link>
            <Link href="/affiliate-disclosure">Affiliate disclosure</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
        <div className="footer-legal">
          <p>
            <strong>Risk warning:</strong> {RISK_WARNING}
          </p>
          <p>
            <strong>Affiliate disclosure:</strong> {AFFILIATE_NOTE} {NOT_ADVICE}
          </p>
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
