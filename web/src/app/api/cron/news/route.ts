import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { generateNews } from "@/lib/news/generate";

// Daily AI news article at 07:00 UTC, triggered by Vercel Cron (see vercel.json).
// Research plus writing usually takes 2 to 5 minutes.

export const maxDuration = 800;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await generateNews("cron");
  if (result.published) revalidatePath("/", "layout");
  return NextResponse.json(result, { status: result.status === "error" ? 500 : 200 });
}
