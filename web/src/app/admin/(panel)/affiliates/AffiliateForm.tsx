"use client";

import { useActionState } from "react";
import { saveAffiliateAction } from "../../actions";

export type AffiliateRow = {
  broker: string;
  name: string;
  url: string | null;
  banner_src: string | null;
  banner_width: number | null;
  banner_height: number | null;
  blocked_countries: string[];
  active: boolean;
};

export default function AffiliateForm({ row }: { row: AffiliateRow }) {
  const [state, action, pending] = useActionState(saveAffiliateAction, null);
  return (
    <form action={action} className="card admin-form">
      <input type="hidden" name="broker" value={row.broker} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{row.name}</h3>
        <label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" name="active" defaultChecked={row.active} /> Active
        </label>
      </div>
      <div className="field">
        <label htmlFor={`${row.broker}-url`}>Tracking link (text CTA)</label>
        <input id={`${row.broker}-url`} name="url" className="input" defaultValue={row.url ?? ""} placeholder="https://…" />
      </div>
      <div className="field">
        <label htmlFor={`${row.broker}-banner`}>Banner iframe src</label>
        <input
          id={`${row.broker}-banner`}
          name="banner_src"
          className="input"
          defaultValue={row.banner_src ?? ""}
          placeholder="https://…"
        />
      </div>
      <div className="calc-row">
        <div className="field">
          <label htmlFor={`${row.broker}-w`}>Banner width</label>
          <input id={`${row.broker}-w`} name="banner_width" type="number" className="input" defaultValue={row.banner_width ?? ""} />
        </div>
        <div className="field">
          <label htmlFor={`${row.broker}-h`}>Banner height</label>
          <input id={`${row.broker}-h`} name="banner_height" type="number" className="input" defaultValue={row.banner_height ?? ""} />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${row.broker}-blocked`}>Blocked countries</label>
        <input
          id={`${row.broker}-blocked`}
          name="blocked_countries"
          className="input"
          defaultValue={row.blocked_countries.join(", ")}
          placeholder="US, CA"
        />
      </div>
      {state?.error && <p className="admin-error">{state.error}</p>}
      {state?.ok && <p className="small" style={{ color: "var(--bull)" }}>Saved.</p>}
      <button className="btn btn-gold btn-sm" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
