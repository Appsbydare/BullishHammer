import type { Metadata } from "next";
import { getLatestCloses } from "@/lib/data";
import { PositionSizeCalculator } from "@/components/Calculators";
import ToolPage from "@/components/ToolPage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Forex Position Size Calculator (Lot Size Calculator)",
  description:
    "Free forex position size calculator. Enter your balance, risk % and stop loss in pips to get the right lot size for EUR/USD, gold and other pairs.",
  alternates: { canonical: "/tools/position-size" },
};

export default async function Page() {
  const { rates, asOf } = await getLatestCloses();
  return (
    <ToolPage
      path="/tools/position-size"
      title="Position size calculator"
      intro="Work out how many lots to trade so that hitting your stop loss costs exactly the share of your account you chose to risk."
      calculator={<PositionSizeCalculator rates={rates} asOf={asOf} />}
      explainer={
        <>
          <h2>How position size is calculated</h2>
          <p>
            Position size = amount at risk ÷ (stop loss in pips × pip value per lot). For example, risking 1% of a
            10,000 USD account is 100 USD. With a 25-pip stop on EUR/USD, where one pip on a standard lot is worth
            10 USD, the position size is 100 ÷ (25 × 10) = 0.40 lots.
          </p>
          <p>
            The result is rounded <em>down</em> to the nearest 0.01 lot, so you never risk more than you planned. If
            your account is in a different currency from the pair&apos;s quote currency, the pip value is converted
            first.
          </p>
          <h2>Why traders size positions this way</h2>
          <p>
            Fixed-percentage risk keeps losses in proportion to your account. A string of losing trades shrinks your
            position sizes automatically, and a wider stop on a volatile pair like GBP/JPY or gold leads to a smaller
            position rather than a bigger loss.
          </p>
        </>
      }
      faq={[
        { q: "How much should I risk per trade?", a: "Many traders risk between 0.5% and 2% of their account per trade. Lower risk means a losing streak does less damage." },
        { q: "What is a standard lot?", a: "In forex a standard lot is 100,000 units of the base currency. A mini lot is 10,000 units (0.10) and a micro lot is 1,000 units (0.01)." },
        { q: "Does the calculator work for gold?", a: "Yes. It assumes a 100-ounce contract and counts a 0.10 USD price move as one pip. Check your broker's gold contract specification, as some differ." },
      ]}
    />
  );
}
