import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import AffiliateForm, { type AffiliateRow } from "./AffiliateForm";

export default async function AffiliatesAdmin() {
  await requireAdmin();
  const [links, byBroker, byPage, byCountry] = await Promise.all([
    query<AffiliateRow>("SELECT * FROM affiliate_links ORDER BY id"),
    query<{ broker: string; kind: string; n: string }>(
      `SELECT broker, kind, count(*) AS n FROM affiliate_clicks
       WHERE created_at > now() - interval '30 days' GROUP BY 1, 2 ORDER BY 1, 2`,
    ),
    query<{ page_path: string | null; n: string }>(
      `SELECT page_path, count(*) AS n FROM affiliate_clicks
       WHERE created_at > now() - interval '30 days' GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
    ),
    query<{ country: string | null; n: string }>(
      `SELECT country, count(*) AS n FROM affiliate_clicks
       WHERE created_at > now() - interval '30 days' GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
    ),
  ]);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Affiliates</h1>
          <p className="muted small">
            <strong>Tracking link</strong> powers the “Trade on …” buttons via /go/[broker]. <strong>Banner</strong> is
            the network iframe; the network picks the creative per country. Blocked countries hide both (ISO codes,
            e.g. US, CA).
          </p>
        </div>
      </div>
      <div className="grid grid-2" style={{ marginBottom: 32 }}>
        {links.map((l) => (
          <AffiliateForm key={l.broker} row={l} />
        ))}
      </div>

      <h2>Clicks, last 30 days</h2>
      <p className="tiny muted" style={{ marginBottom: 12 }}>
        Banner clicks are inferred from focus moving into the banner iframe, so treat them as approximate. Link clicks
        are exact.
      </p>
      <div className="grid grid-3">
        <div className="card">
          <h3>By broker</h3>
          <StatList rows={byBroker.map((r) => [`${r.broker} · ${r.kind}`, r.n])} />
        </div>
        <div className="card">
          <h3>Top pages</h3>
          <StatList rows={byPage.map((r) => [r.page_path ?? "(unknown)", r.n])} />
        </div>
        <div className="card">
          <h3>Top countries</h3>
          <StatList rows={byCountry.map((r) => [r.country ?? "(unknown)", r.n])} />
        </div>
      </div>
    </>
  );
}

function StatList({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return <p className="muted small">No clicks yet.</p>;
  return (
    <div className="result-list" style={{ marginTop: 8, paddingTop: 8 }}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          <span>{Number(v).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
