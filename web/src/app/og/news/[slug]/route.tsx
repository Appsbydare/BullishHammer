import { ImageResponse } from "next/og";
import { getPublishedArticle } from "@/lib/news/data";
import { shortDate } from "@/lib/format";
import { SITE } from "@/lib/site";

export const revalidate = 86400;

const size = { width: 1200, height: 630 };

/** Featured image for news articles (Open Graph and NewsArticle structured data). Stable URL: /og/news/<slug>. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a) return new Response("Not found", { status: 404 });
  const title = a.title;
  const date = a.published_at ? shortDate(a.published_at) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #12161b 0%, #0b0d10 70%)",
          color: "#e8ebef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Hammer candle mark */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 22, height: 26, background: "#22c27a", borderRadius: 3 }} />
            <div style={{ width: 4, height: 54, background: "#22c27a" }} />
          </div>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700 }}>
            Bullish<span style={{ color: "#d9aa3c" }}>Hammer</span>
          </div>
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 26, color: "#8d97a3" }}>Market news</div>
        </div>
        <div style={{ display: "flex", fontSize: title.length > 70 ? 56 : 66, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#8d97a3" }}>
          <span>{date}</span>
          <span style={{ color: "#d9aa3c" }}>{SITE.domain}</span>
        </div>
      </div>
    ),
    size,
  );
}
