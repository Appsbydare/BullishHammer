import type { Metadata } from "next";
import { getLatestCloses } from "@/lib/data";
import { MarginCalculator } from "@/components/Calculators";
import ToolPage from "@/components/ToolPage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Forex Margin Calculator",
  description:
    "Free forex margin calculator. See how much margin a trade needs at your leverage for EUR/USD, gold and other pairs, in your account currency.",
  alternates: { canonical: "/tools/margin" },
};

export default async function Page() {
  const { rates, asOf } = await getLatestCloses();
  return (
    <ToolPage
      path="/tools/margin"
      title="Margin calculator"
      intro="See how much of your balance a broker will set aside as margin to open a position at your leverage."
      calculator={<MarginCalculator rates={rates} asOf={asOf} />}
      explainer={
        <>
          <h2>How margin is calculated</h2>
          <p>
            Required margin = (lots × contract size) ÷ leverage, valued in the pair&apos;s base currency and converted
            to your account currency. One lot of EUR/USD is 100,000 EUR; at 1:30 leverage the margin is 100,000 ÷ 30 ≈
            3,333 EUR, converted to your account currency.
          </p>
          <h2>Margin is not the risk</h2>
          <p>
            Margin is a deposit, not a cost. What you can lose depends on position size and how far price moves.
            Higher leverage lowers the margin needed but makes it easier to open positions that are too large for your
            account.
          </p>
        </>
      }
      faq={[
        { q: "What leverage can I use?", a: "It depends on your country and broker. Retail clients in the EU, UK and Australia are usually limited to 1:30 on major forex pairs and 1:20 on gold." },
        { q: "What happens if my margin runs out?", a: "If your equity falls below the broker's margin requirement you may get a margin call, and positions can be closed automatically (stop out)." },
        { q: "Why does margin change while my trade is open?", a: "Margin is tied to the position's value, which moves with the price and with the exchange rate to your account currency." },
      ]}
    />
  );
}
