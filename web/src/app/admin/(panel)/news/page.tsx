import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { timeAgo } from "@/lib/format";
import { setAutoPublishAction } from "../../actions";
import GenerateNewsButton from "./GenerateNewsButton";

export const maxDuration = 800; // "Generate now" runs inside this page's server action

type Row = { id: number; title: string; slug: string; status: string; created_at: Date; published_at: Date | null };
type Run = {
  id: number;
  trigger: string;
  started_at: Date;
  finished_at: Date | null;
  status: string;
  article_id: number | null;
  input_tokens: number;
  output_tokens: number;
  web_searches: number;
  cost_usd: string;
  error: string | null;
};

const ago = (d: Date | string) => timeAgo(new Date(d).toISOString());

export default async function AdminNews() {
  await requireAdmin();
  const [articles, runs, autoPublish, [month]] = await Promise.all([
    query<Row>("SELECT id, title, slug, status, created_at, published_at FROM news_articles ORDER BY created_at DESC LIMIT 100"),
    query<Run>("SELECT * FROM news_runs ORDER BY started_at DESC LIMIT 15"),
    getSetting<boolean>("news_auto_publish", false),
    query<{ cost: string | null }>("SELECT sum(cost_usd) AS cost FROM news_runs WHERE started_at > now() - interval '30 days'"),
  ]);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>News</h1>
          <p className="muted small">
            Claude writes one article a day at 07:00 UTC using web search. Review drafts here before publishing.
            Estimated AI cost, last 30 days: ${Number(month.cost ?? 0).toFixed(2)}.
          </p>
        </div>
        <GenerateNewsButton />
      </div>

      <form action={setAutoPublishAction} className="card admin-inline" style={{ padding: 14 }}>
        <input type="hidden" name="value" value={autoPublish ? "off" : "on"} />
        <span>
          Auto-publish is <strong>{autoPublish ? "on" : "off"}</strong>.{" "}
          <span className="muted small">
            {autoPublish ? "New articles go live immediately." : "New articles are saved as drafts."}
          </span>
        </span>
        <button className="btn btn-ghost btn-sm">{autoPublish ? "Turn off" : "Turn on"}</button>
      </form>

      <h2>Articles</h2>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No articles yet.
                </td>
              </tr>
            )}
            {articles.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/news/${a.id}`}>{a.title}</Link>
                </td>
                <td>
                  <span className={`status status-${a.status}`}>{a.status}</span>
                </td>
                <td>{ago(a.created_at)}</td>
                <td>{a.published_at ? ago(a.published_at) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Generation runs</h2>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Started</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Searches</th>
              <th>Tokens in / out</th>
              <th>Cost (est.)</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  No runs yet.
                </td>
              </tr>
            )}
            {runs.map((r) => (
              <tr key={r.id}>
                <td>{ago(r.started_at)}</td>
                <td>{r.trigger}</td>
                <td>
                  <span className={`status status-${r.status}`}>{r.status}</span>
                </td>
                <td>
                  {r.finished_at
                    ? `${Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000)}s`
                    : "—"}
                </td>
                <td>{r.web_searches}</td>
                <td>
                  {r.input_tokens.toLocaleString()} / {r.output_tokens.toLocaleString()}
                </td>
                <td>${Number(r.cost_usd).toFixed(2)}</td>
                <td className="admin-err">{r.error ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
