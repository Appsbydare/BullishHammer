import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { runScanner } from "@/lib/scanner/run";

// Hourly scanner run, triggered by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer $CRON_SECRET". With the free Twelve Data plan (8 calls/min),
// 14 symbols take about 70 seconds.

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await runScanner("cron");
  revalidatePath("/", "layout");
  return NextResponse.json(summary, { status: summary.status === "error" ? 500 : 200 });
}
