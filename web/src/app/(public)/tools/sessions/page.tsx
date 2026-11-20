import type { Metadata } from "next";
import Link from "next/link";
import SessionClock from "@/components/SessionClock";
import ToolPage from "@/components/ToolPage";

export const metadata: Metadata = {
  title: "Forex Market Hours: Session Clock in Your Time Zone",
  description:
    "Live forex session clock. See when the Sydney, Tokyo, London and New York sessions open and close in your local time, and when they overlap.",
  alternates: { canonical: "/tools/sessions" },
};

export default function Page() {
  return (
    <ToolPage
      path="/tools/sessions"
      title="Forex market session clock"
      intro="See which forex sessions are open right now and when Sydney, Tokyo, London and New York open and close in your own time zone. Daylight saving is handled automatically."
      calculator={<SessionClock />}
      note="Session hours are typical local business hours. Liquidity also depends on holidays and news events."
      explainer={
        <>
          <h2>The four forex sessions</h2>
          <p>
            Forex trades 24 hours a day from Sunday evening to Friday evening (New York time), passing from one
            financial centre to the next. Sydney opens the week, followed by Tokyo, then London and New York. Each
            session here uses the local business hours of its city: Sydney 07:00–16:00, Tokyo 09:00–18:00, London
            08:00–17:00 and New York 08:00–17:00.
          </p>
          <h2>Why overlaps matter</h2>
          <p>
            Liquidity and volatility are usually highest when two big centres are open together. The London and New
            York overlap is the busiest period of the day for EUR/USD, GBP/USD and gold. The Sydney and Tokyo overlap
            matters most for AUD, NZD and JPY pairs.
          </p>
          <h2>Sessions and candlestick patterns</h2>
          <p>
            A pattern that forms during a busy session carries more weight than one printed in thin trading. Check the
            session when you read the latest results on the <Link href="/scanner">pattern scanner</Link>. The scanner
            builds H4 and D1 candles on broker server time (New York 5pm close), the same as MT4 and MT5.
          </p>
        </>
      }
      faq={[
        {
          q: "What time does the forex market open?",
          a: "The market opens on Sunday at 5pm New York time, when the Sydney session begins its Monday, and closes on Friday at 5pm New York time.",
        },
        {
          q: "Which forex session is the most volatile?",
          a: "The London session, and especially its overlap with New York, usually has the highest volume and the biggest moves on major pairs and gold.",
        },
        {
          q: "Do session times change with daylight saving?",
          a: "Yes. Sydney, London and New York change their clocks on different dates, so the sessions shift against each other for a few weeks each spring and autumn. This clock uses each city's local time, so it is always correct.",
        },
      ]}
    />
  );
}
