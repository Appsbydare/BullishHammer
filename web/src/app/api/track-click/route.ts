import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";

// Records a banner click (sent by AffiliateBanner via sendBeacon).

export async function POST(req: NextRequest) {
  let body: { broker?: unknown; page?: unknown };
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const broker = typeof body.broker === "string" ? body.broker.toLowerCase().slice(0, 40) : "";
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : null;
  if (!broker) return new NextResponse(null, { status: 400 });

  await query(
    `INSERT INTO affiliate_clicks (broker, kind, page_path, country)
     SELECT $1, 'banner', $2, $3 WHERE EXISTS (SELECT 1 FROM affiliate_links WHERE broker = $1)`,
    [broker, page, req.headers.get("x-vercel-ip-country")],
  );
  return new NextResponse(null, { status: 204 });
}
