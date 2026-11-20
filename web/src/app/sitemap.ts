import type { MetadataRoute } from "next";
import { getPatterns, getSymbols } from "@/lib/data";
import { getPublishedNews } from "@/lib/news/data";
import { BROKER_PAGES } from "@/lib/brokers";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const url = (p: string) => `${SITE.url}${p}`;
  const fixed = [
    { path: "/", freq: "hourly", priority: 1 },
    { path: "/scanner", freq: "hourly", priority: 0.9 },
    { path: "/patterns", freq: "weekly", priority: 0.8 },
    { path: "/tools", freq: "monthly", priority: 0.6 },
    { path: "/tools/position-size", freq: "monthly", priority: 0.7 },
    { path: "/tools/pip-value", freq: "monthly", priority: 0.7 },
    { path: "/tools/margin", freq: "monthly", priority: 0.7 },
    { path: "/tools/sessions", freq: "monthly", priority: 0.7 },
    { path: "/calendar", freq: "daily", priority: 0.7 },
    { path: "/news", freq: "daily", priority: 0.8 },
    { path: "/brokers", freq: "monthly", priority: 0.7 },
    ...BROKER_PAGES.map((b) => ({ path: `/brokers/${b.slug}`, freq: "monthly", priority: 0.7 }) as const),
    { path: "/about", freq: "yearly", priority: 0.3 },
    { path: "/contact", freq: "yearly", priority: 0.3 },
    { path: "/risk-warning", freq: "yearly", priority: 0.2 },
    { path: "/disclaimer", freq: "yearly", priority: 0.2 },
    { path: "/affiliate-disclosure", freq: "yearly", priority: 0.2 },
    { path: "/privacy", freq: "yearly", priority: 0.2 },
  ] as const;

  let symbols: { symbol: string }[] = [];
  let patterns: { slug: string }[] = [];
  let news: { slug: string; published_at: string | null }[] = [];
  try {
    [symbols, patterns, news] = await Promise.all([getSymbols(), getPatterns(), getPublishedNews({ limit: 1000 })]);
  } catch {
    // DB unavailable: still return the fixed pages.
  }

  return [
    ...fixed.map((f) => ({ url: url(f.path), lastModified: now, changeFrequency: f.freq, priority: f.priority })),
    ...symbols.map((s) => ({
      url: url(`/scanner/${s.symbol.toLowerCase()}`),
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...patterns.map((p) => ({
      url: url(`/patterns/${p.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...news.map((a) => ({
      url: url(`/news/${a.slug}`),
      lastModified: a.published_at ? new Date(a.published_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
