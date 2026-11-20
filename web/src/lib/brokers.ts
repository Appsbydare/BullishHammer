import "server-only";
import { query } from "@/lib/db";

/** Review pages. `broker` matches affiliate_links.broker and broker_content.broker. */
export const BROKER_PAGES = [
  { slug: "xm", broker: "xm", name: "XM" },
  { slug: "ic-markets", broker: "icmarkets", name: "IC Markets" },
] as const;
export type BrokerPage = (typeof BROKER_PAGES)[number];

/** Rows of the comparison table, stored as broker_content section `fact:<key>`. */
export const FACTS = [
  { key: "regulation", label: "Regulation" },
  { key: "min_deposit", label: "Minimum deposit" },
  { key: "max_leverage", label: "Maximum leverage" },
  { key: "account_types", label: "Account types" },
  { key: "spreads", label: "Spreads" },
  { key: "commission", label: "Commission" },
  { key: "platforms", label: "Platforms" },
  { key: "best_for", label: "Best for" },
] as const;

/** Markdown sections, in page order. */
export const SECTIONS = [
  { key: "intro", label: "Introduction", heading: null },
  { key: "accounts", label: "Account types", heading: "Account types" },
  { key: "platforms", label: "Platforms", heading: "Trading platforms" },
  { key: "regulation", label: "Regulation", heading: "Regulation and safety" },
  { key: "pros", label: "Pros (markdown list)", heading: null },
  { key: "cons", label: "Cons (markdown list)", heading: null },
  { key: "verdict", label: "Verdict", heading: "Verdict" },
] as const;

export type BrokerReview = {
  page: BrokerPage;
  facts: Record<string, string>;
  sections: Record<string, string>;
  lastChecked: string; // YYYY-MM-DD or ""
  updatedAt: string | null;
};

export function brokerPage(slug: string): BrokerPage | undefined {
  return BROKER_PAGES.find((b) => b.slug === slug);
}

export async function getBrokerReviews(): Promise<BrokerReview[]> {
  const rows = await query<{ broker: string; section: string; content_md: string; updated_at: string | Date }>(
    "SELECT broker, section, content_md, updated_at FROM broker_content",
  );
  return BROKER_PAGES.map((page) => {
    const mine = rows.filter((r) => r.broker === page.broker);
    const facts: Record<string, string> = {};
    const sections: Record<string, string> = {};
    let lastChecked = "";
    let updated = 0;
    for (const r of mine) {
      updated = Math.max(updated, new Date(r.updated_at).getTime());
      if (r.section === "last_checked") lastChecked = r.content_md;
      else if (r.section.startsWith("fact:")) facts[r.section.slice(5)] = r.content_md;
      else sections[r.section] = r.content_md;
    }
    return { page, facts, sections, lastChecked, updatedAt: updated ? new Date(updated).toISOString() : null };
  });
}

export async function getBrokerReview(slug: string): Promise<BrokerReview | null> {
  const page = brokerPage(slug);
  if (!page) return null;
  return (await getBrokerReviews()).find((r) => r.page.slug === slug) ?? null;
}
