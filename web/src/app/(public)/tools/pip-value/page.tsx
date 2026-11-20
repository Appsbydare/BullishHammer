import type { Metadata } from "next";
import { getLatestCloses } from "@/lib/data";
import { PipValueCalculator } from "@/components/Calculators";
import ToolPage from "@/components/ToolPage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pip Value Calculator for Forex & Gold",
  description:
    "Free pip value calculator. See what one pip is worth for any lot size on EUR/USD, USD/JPY, gold and more, in your account currency.",
  alternates: { canonical: "/tools/pip-value" },
};

export default async function Page() {
  const { rates, asOf } = await getLatestCloses();
  return (
    <ToolPage
      path="/tools/pip-value"
      title="Pip value calculator"
      intro="Find out how much money a one-pip move makes or loses for your position, converted into your account currency."
      calculator={<PipValueCalculator rates={rates} asOf={asOf} />}
      explainer={
        <>
          <h2>How pip value is calculated</h2>
          <p>
            Pip value = lots × contract size × pip size, expressed in the pair&apos;s quote currency, then converted to
            your account currency. For EUR/USD, 1 lot × 100,000 × 0.0001 = 10 USD per pip. For USD/JPY the pip size is
            0.01, so one lot is worth 1,000 JPY per pip, which is then converted to your account currency.
          </p>
          <h2>Why pip value changes</h2>
          <p>
            When your account currency matches the quote currency (for example a USD account trading EUR/USD), the pip
            value is fixed. Otherwise it moves with the exchange rate between the quote currency and your account
            currency.
          </p>
        </>
      }
      faq={[
        { q: "What is a pip?", a: "A pip is the standard unit of price movement: 0.0001 for most pairs and 0.01 for pairs quoted in Japanese yen." },
        { q: "What is a pipette?", a: "A pipette is one tenth of a pip, the fifth decimal place on most pairs (third on JPY pairs). Most brokers quote prices to the pipette." },
        { q: "How much is a pip worth on gold?", a: "With a 100-ounce contract and a pip of 0.10, one pip on 1.00 lot of XAU/USD is worth 10 USD." },
      ]}
    />
  );
}
