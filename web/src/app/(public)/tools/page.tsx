import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Forex Trading Tools and Calculators",
  description:
    "Free forex trading tools: position size, pip value and margin calculators, a market session clock and an economic calendar. Work on mobile, no sign-up.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  { href: "/tools/position-size", title: "Position size calculator", text: "Lot size from balance, risk % and stop loss." },
  { href: "/tools/pip-value", title: "Pip value calculator", text: "What one pip is worth in your account currency." },
  { href: "/tools/margin", title: "Margin calculator", text: "Margin required at your leverage." },
  { href: "/tools/sessions", title: "Session clock", text: "Sydney, Tokyo, London and New York hours in your time zone." },
  { href: "/calendar", title: "Economic calendar", text: "High-impact releases for the major economies." },
];

export default function ToolsPage() {
  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Tools</p>
        <h1>Free trading tools</h1>
        <p>Plan trades before you place them. All tools run in your browser and work on mobile.</p>
      </div>
      <div className="grid grid-3" style={{ marginTop: 16 }}>
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
  );
}
