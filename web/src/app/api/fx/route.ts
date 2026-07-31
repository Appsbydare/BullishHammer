import { NextResponse } from "next/server";
import { getFXSnapshot } from "@/lib/fx";

/**
 * GET /api/fx
 * Serves the FX snapshot (rates + sparklines) for client-side polling.
 * Upstream calls are cached in getFXSnapshot, so this stays cheap against the
 * free-tier request budget even with several clients polling.
 */
export async function GET() {
  try {
    const snapshot = await getFXSnapshot();
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load FX rates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
