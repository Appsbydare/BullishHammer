"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { runScanner, type RunSummary } from "@/lib/scanner/run";
import { generateNews, slugify, type NewsRunResult } from "@/lib/news/generate";
import { setSetting } from "@/lib/settings";
import { BROKER_PAGES, FACTS, SECTIONS } from "@/lib/brokers";

export async function loginAction(_prev: { error?: string } | null, form: FormData) {
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "Wrong password." };
  }
  await startSession();
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

export async function runScannerAction(): Promise<RunSummary> {
  await requireAdmin();
  const summary = await runScanner("manual");
  revalidatePath("/", "layout");
  return summary;
}

export async function toggleSymbolAction(form: FormData) {
  await requireAdmin();
  await query("UPDATE symbols SET active = NOT active WHERE id = $1", [Number(form.get("id"))]);
  revalidatePath("/", "layout");
}

export async function saveAffiliateAction(_prev: { ok?: boolean; error?: string } | null, form: FormData) {
  await requireAdmin();
  const broker = String(form.get("broker") ?? "");
  const url = String(form.get("url") ?? "").trim();
  const bannerSrc = String(form.get("banner_src") ?? "").trim();
  const width = Number(form.get("banner_width")) || null;
  const height = Number(form.get("banner_height")) || null;
  const blocked = String(form.get("blocked_countries") ?? "")
    .split(/[\s,]+/)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));
  const active = form.get("active") === "on";

  for (const u of [url, bannerSrc]) {
    if (u && !/^https:\/\//i.test(u)) return { error: "Links must start with https://" };
  }
  await query(
    `UPDATE affiliate_links SET url = $2, banner_src = $3, banner_width = $4, banner_height = $5,
       blocked_countries = $6, active = $7, updated_at = now() WHERE broker = $1`,
    [broker, url || null, bannerSrc || null, width, height, blocked, active],
  );
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── News ────────────────────────────────────────────────────────────────

export async function generateNewsAction(): Promise<NewsRunResult> {
  await requireAdmin();
  const result = await generateNews("manual");
  if (result.published) revalidatePath("/", "layout");
  return result;
}

export async function setAutoPublishAction(form: FormData) {
  await requireAdmin();
  await setSetting("news_auto_publish", form.get("value") === "on");
  revalidatePath("/admin/news");
}

type FormState = { ok?: boolean; error?: string } | null;

export async function saveArticleAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(form.get("id"));
  const title = String(form.get("title") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? "") || title);
  const excerpt = String(form.get("excerpt") ?? "").trim();
  const body = String(form.get("body_md") ?? "").trim();
  const tags = String(form.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const known = (await query<{ symbol: string }>("SELECT symbol FROM symbols")).map((s) => s.symbol);
  const symbols = String(form.get("symbols") ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => known.includes(s));
  const sources: { title: string; url: string }[] = [];
  for (const line of String(form.get("sources") ?? "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const i = line.lastIndexOf("|");
    const url = (i >= 0 ? line.slice(i + 1) : line).trim();
    const t = (i >= 0 ? line.slice(0, i) : url).trim();
    if (!/^https?:\/\/\S+$/i.test(url)) return { error: `Invalid source URL: ${url}` };
    sources.push({ title: t || url, url });
  }

  if (!title || !excerpt || !body || !slug) return { error: "Title, slug, excerpt and body are required." };
  const [clash] = await query<{ n: string }>("SELECT count(*) AS n FROM news_articles WHERE slug = $1 AND id <> $2", [slug, id]);
  if (Number(clash.n) > 0) return { error: "Another article already uses that slug." };

  await query(
    `UPDATE news_articles SET title = $2, slug = $3, excerpt = $4, body_md = $5, tags = $6, symbols = $7,
       sources = $8::jsonb, updated_at = now() WHERE id = $1`,
    [id, title, slug, excerpt, body, tags, symbols, JSON.stringify(sources)],
  );
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setArticleStatusAction(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  const publish = form.get("status") === "published";
  await query(
    `UPDATE news_articles SET status = $2, published_at = CASE WHEN $3 THEN coalesce(published_at, now()) ELSE published_at END,
       updated_at = now() WHERE id = $1`,
    [id, publish ? "published" : "draft", publish],
  );
  revalidatePath("/", "layout");
}

export async function deleteArticleAction(form: FormData) {
  await requireAdmin();
  await query("DELETE FROM news_articles WHERE id = $1", [Number(form.get("id"))]);
  revalidatePath("/", "layout");
  redirect("/admin/news");
}

// ── Broker reviews ──────────────────────────────────────────────────────

export async function saveBrokerContentAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const broker = String(form.get("broker") ?? "");
  if (!BROKER_PAGES.some((b) => b.broker === broker)) return { error: "Unknown broker." };
  const sections = [...FACTS.map((f) => `fact:${f.key}`), ...SECTIONS.map((s) => s.key), "last_checked"];
  const lastChecked = String(form.get("last_checked") ?? "").trim();
  if (lastChecked && !/^\d{4}-\d{2}-\d{2}$/.test(lastChecked)) return { error: "Last checked must be a date." };
  const values = sections.map((s) => String(form.get(s) ?? "").trim());
  await query(
    `INSERT INTO broker_content (broker, section, content_md, updated_at)
     SELECT $1, s, c, now() FROM unnest($2::text[], $3::text[]) AS t(s, c)
     ON CONFLICT (broker, section) DO UPDATE SET content_md = EXCLUDED.content_md, updated_at = now()
     WHERE broker_content.content_md IS DISTINCT FROM EXCLUDED.content_md`,
    [broker, sections, values],
  );
  revalidatePath("/", "layout");
  return { ok: true };
}
