import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import RunScannerButton from "./RunScannerButton";

export const maxDuration = 300; // the "Run now" action shares this page's limit

type Run = {
  id: number;
  trigger: string;
  started_at: Date;
  finished_at: Date | null;
  status: string;
  symbols_scanned: number;
  candles_stored: number;
  signals_found: number;
  error: string | null;
};

export default async function AdminScanner() {
  await requireAdmin();
  const [runs, [stats]] = await Promise.all([
    query<Run>("SELECT * FROM scanner_runs ORDER BY started_at DESC LIMIT 25"),
    query<{ signals24: string; signals: string; candles: string; clicks30: string }>(
      `SELECT (SELECT count(*) FROM signals WHERE created_at > now() - interval '24 hours') AS signals24,
              (SELECT count(*) FROM signals) AS signals,
              (SELECT count(*) FROM candles) AS candles,
              (SELECT count(*) FROM affiliate_clicks WHERE created_at > now() - interval '30 days') AS clicks30`,
    ),
  ]);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Scanner</h1>
          <p className="muted small">Runs hourly at :05 via Vercel Cron. A manual run takes about 70 seconds.</p>
        </div>
        <RunScannerButton />
      </div>
      <div className="admin-stats">
        <div className="card">
          <span>New signals (24h)</span>
          <strong>{Number(stats.signals24).toLocaleString()}</strong>
        </div>
        <div className="card">
          <span>Total signals</span>
          <strong>{Number(stats.signals).toLocaleString()}</strong>
        </div>
        <div className="card">
          <span>Stored H1 candles</span>
          <strong>{Number(stats.candles).toLocaleString()}</strong>
        </div>
        <div className="card">
          <span>Affiliate clicks (30d)</span>
          <strong>{Number(stats.clicks30).toLocaleString()}</strong>
        </div>
      </div>
      <h2>Recent runs</h2>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Started</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Symbols</th>
              <th>Candles</th>
              <th>Signals</th>
              <th>Duration</th>
              <th>Errors</th>
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
                <td title={new Date(r.started_at).toISOString()}>{timeAgo(new Date(r.started_at).toISOString())}</td>
                <td>{r.trigger}</td>
                <td>
                  <span className={`status status-${r.status}`}>{r.status}</span>
                </td>
                <td>{r.symbols_scanned}</td>
                <td>{r.candles_stored.toLocaleString()}</td>
                <td>{r.signals_found}</td>
                <td>
                  {r.finished_at
                    ? `${Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000)}s`
                    : "—"}
                </td>
                <td className="admin-err">{r.error ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
