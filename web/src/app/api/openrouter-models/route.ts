import { NextResponse } from "next/server";

/**
 * GET /api/openrouter-models
 * Server-side proxy that fetches all OpenRouter models and returns only the free ones.
 * "Free" = pricing.prompt === "0" (string zero from the API).
 */
export async function GET() {
  try {
    const apiKey =
      process.env.OPENROUTER_API_KEY || "";

    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: apiKey
        ? { Authorization: `Bearer ${apiKey}` }
        : {},
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenRouter API error: ${res.status}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    const models: any[] = json.data || [];

    // Filter free models: prompt price === "0"
    const free = models
      .filter((m: any) => {
        const prompt = m?.pricing?.prompt;
        return prompt === "0" || prompt === 0;
      })
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        context: m.context_length || null,
        description: m.description || "",
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({ models: free });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch models" },
      { status: 500 }
    );
  }
}
