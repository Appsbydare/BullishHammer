import { NextResponse, type NextRequest } from "next/server";

// Visitor country from Vercel's edge geo header. Kept out of page rendering so pages stay cacheable.

export function GET(req: NextRequest) {
  return NextResponse.json(
    { country: req.headers.get("x-vercel-ip-country") },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
