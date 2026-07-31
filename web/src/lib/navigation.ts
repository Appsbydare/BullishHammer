import { client } from "@/sanity/client";
import { defineQuery } from "next-sanity";

export interface NavCategory {
  title: string;
  slug: string;
  count: number;
}

const NAV_CATEGORIES_QUERY = defineQuery(`
  *[_type == "category" && defined(slug.current)]{
    title,
    "slug": slug.current,
    "count": count(*[_type == "article" && references(^._id) && status == "published" && defined(slug.current)])
  } | order(count desc)
`);

/**
 * Categories that actually have published articles, for the main nav.
 *
 * The nav used to be hardcoded (Markets / Economy / Analysis / Podcasts / TV)
 * with every link pointing at "#". Driving it from Sanity means every visible
 * link resolves to a real page with real content.
 */
export async function getNavCategories(): Promise<NavCategory[]> {
  try {
    const categories = await client.fetch<NavCategory[]>(
      NAV_CATEGORIES_QUERY,
      {},
      { next: { revalidate: 300 } }
    );
    return (categories ?? []).filter((c) => c.count > 0);
  } catch (error) {
    console.error("Failed to load nav categories:", error instanceof Error ? error.message : error);
    return [];
  }
}
