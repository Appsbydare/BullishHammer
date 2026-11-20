import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { toggleSymbolAction } from "../../actions";

type Row = {
  id: number;
  symbol: string;
  provider_symbol: string;
  display_name: string;
  category: string;
  active: boolean;
  candles: string;
  signals: string;
};

export default async function SymbolsAdmin() {
  await requireAdmin();
  const rows = await query<Row>(
    `SELECT s.*, (SELECT count(*) FROM candles c WHERE c.symbol_id = s.id) AS candles,
            (SELECT count(*) FROM signals g WHERE g.symbol_id = s.id) AS signals
     FROM symbols s ORDER BY s.sort_order`,
  );
  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Symbols</h1>
          <p className="muted small">
            Indices and oil need a paid Twelve Data plan (Grow or higher). Enabling them on the free plan makes their
            fetch fail; the rest of the run continues.
          </p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Provider ticker</th>
              <th>Category</th>
              <th>H1 candles</th>
              <th>Signals</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.symbol}</strong>
                  <div className="tiny muted">{r.display_name}</div>
                </td>
                <td>{r.provider_symbol}</td>
                <td>{r.category}</td>
                <td>{Number(r.candles).toLocaleString()}</td>
                <td>{Number(r.signals).toLocaleString()}</td>
                <td>
                  <span className={`status ${r.active ? "status-success" : "status-off"}`}>
                    {r.active ? "active" : "off"}
                  </span>
                </td>
                <td>
                  <form action={toggleSymbolAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-ghost btn-sm">{r.active ? "Disable" : "Enable"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
