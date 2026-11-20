"use client";

import { useActionState } from "react";
import { saveArticleAction } from "../../../actions";

export type ArticleFields = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  tags: string[];
  symbols: string[];
  sources: { title: string; url: string }[];
};

export default function ArticleForm({ a }: { a: ArticleFields }) {
  const [state, action, pending] = useActionState(saveArticleAction, null);
  return (
    <form action={action} className="card admin-form">
      <input type="hidden" name="id" value={a.id} />
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" className="input" defaultValue={a.title} required />
      </div>
      <div className="field">
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" className="input" defaultValue={a.slug} required />
        <p className="hint">Changing the slug of a published article breaks existing links to it.</p>
      </div>
      <div className="field">
        <label htmlFor="excerpt">Excerpt (meta description)</label>
        <textarea id="excerpt" name="excerpt" className="input" defaultValue={a.excerpt} rows={2} required />
      </div>
      <div className="field">
        <label htmlFor="body_md">Body (Markdown)</label>
        <textarea id="body_md" name="body_md" className="input" defaultValue={a.body_md} rows={24} required />
      </div>
      <div className="admin-grid-2">
        <div className="field">
          <label htmlFor="tags">Tags</label>
          <input id="tags" name="tags" className="input" defaultValue={a.tags.join(", ")} />
        </div>
        <div className="field">
          <label htmlFor="symbols">Symbols</label>
          <input id="symbols" name="symbols" className="input" defaultValue={a.symbols.join(", ")} placeholder="XAUUSD, EURUSD" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="sources">Sources (one per line: Title | https://url)</label>
        <textarea
          id="sources"
          name="sources"
          className="input"
          rows={6}
          defaultValue={a.sources.map((s) => `${s.title} | ${s.url}`).join("\n")}
        />
      </div>
      {state?.error && <p className="admin-error">{state.error}</p>}
      {state?.ok && <p className="small" style={{ color: "var(--bull)" }}>Saved.</p>}
      <button className="btn btn-gold btn-sm" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
