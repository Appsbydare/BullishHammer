"use client";

import { useActionState } from "react";
import { saveBrokerContentAction } from "../../actions";

type Field = { key: string; label: string };

type Props = {
  broker: string;
  name: string;
  slug: string;
  facts: Field[];
  sections: Field[];
  values: { facts: Record<string, string>; sections: Record<string, string>; lastChecked: string };
};

export default function BrokerForm({ broker, name, slug, facts, sections, values }: Props) {
  const [state, action, pending] = useActionState(saveBrokerContentAction, null);
  return (
    <form action={action} className="card admin-form">
      <input type="hidden" name="broker" value={broker} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h3 style={{ margin: 0 }}>{name}</h3>
        <a href={`/brokers/${slug}`} target="_blank" className="small">
          View page ↗
        </a>
      </div>
      <div className="field">
        <label htmlFor={`${broker}-checked`}>Figures last checked</label>
        <input id={`${broker}-checked`} name="last_checked" type="date" className="input" defaultValue={values.lastChecked} />
        <p className="hint">Shown on the review. Update it whenever you verify the figures on the broker&apos;s site.</p>
      </div>
      <h4 style={{ margin: "8px 0 0" }}>Comparison table</h4>
      {facts.map((f) => (
        <div key={f.key} className="field">
          <label htmlFor={`${broker}-${f.key}`}>{f.label}</label>
          <input id={`${broker}-${f.key}`} name={`fact:${f.key}`} className="input" defaultValue={values.facts[f.key] ?? ""} />
        </div>
      ))}
      <h4 style={{ margin: "8px 0 0" }}>Review text (Markdown)</h4>
      {sections.map((s) => (
        <div key={s.key} className="field">
          <label htmlFor={`${broker}-${s.key}`}>{s.label}</label>
          <textarea
            id={`${broker}-${s.key}`}
            name={s.key}
            className="input"
            rows={s.key === "intro" || s.key === "verdict" ? 3 : 5}
            defaultValue={values.sections[s.key] ?? ""}
          />
        </div>
      ))}
      {state?.error && <p className="admin-error">{state.error}</p>}
      {state?.ok && <p className="small" style={{ color: "var(--bull)" }}>Saved.</p>}
      <button className="btn btn-gold btn-sm" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Saving…" : `Save ${name}`}
      </button>
    </form>
  );
}
