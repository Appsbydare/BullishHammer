import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";

// /go/xm?symbol=XAUUSD&from=/scanner → logs the click, then redirects to the broker's tracking URL.

export async function GET(req: NextRequest, { params }: { params: Promise<{ broker: string }> }) {
  const { broker } = await params;
  const [link] = await query<{ url: string; blocked_countries: string[] }>(
    "SELECT url, blocked_countries FROM affiliate_links WHERE broker = $1 AND active AND url IS NOT NULL",
    [broker.toLowerCase()],
  );
  if (!link) return NextResponse.redirect(new URL("/", req.url), 302);

  const country = req.headers.get("x-vercel-ip-country");
  if (country && link.blocked_countries.includes(country)) {
    return NextResponse.redirect(new URL("/affiliate-disclosure", req.url), 302);
  }

  const sp = req.nextUrl.searchParams;
  const from = sp.get("from") || refererPath(req.headers.get("referer"), req.nextUrl.origin);
  try {
    await query(
      "INSERT INTO affiliate_clicks (broker, kind, page_path, symbol, country) VALUES ($1, 'link', $2, $3, $4)",
      [broker.toLowerCase(), from?.slice(0, 200) ?? null, sp.get("symbol")?.slice(0, 20) ?? null, country],
    );
  } catch (err) {
    console.error("click log failed", err); // never block the redirect
  }

  const res = NextResponse.redirect(link.url, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

function refererPath(ref: string | null, origin: string) {
  if (!ref) return null;
  try {
    const u = new URL(ref);
    return u.origin === origin ? u.pathname : null;
  } catch {
    return null;
  }
}
