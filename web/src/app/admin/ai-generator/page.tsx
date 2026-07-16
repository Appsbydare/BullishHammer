import AiGeneratorForm from "../AiGeneratorForm";
import { client } from "@/sanity/client";
import { defineQuery } from "next-sanity";
import SubmitButton from "../SubmitButton";
import { approveDraft, deleteDraft } from "../actions";

export const metadata = {
  title: "AI Generator - Bullish Hammer Admin",
};

const DRAFTS_QUERY = defineQuery(
  `*[_type == "article" && status == "draft"] | order(_createdAt desc){
    _id, title, excerpt, _createdAt, aiProvenance,
    "coverImageUrl": coverImage.asset->url
  }`
);

export default async function AiGeneratorPage() {
  const drafts = await client.fetch(DRAFTS_QUERY, {}, { next: { revalidate: 0 } });

  return (
    <>
      <header className="admin-header">
        <h1>AI Article Generator</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', alignItems: 'start' }}>
        <section className="admin-section" style={{ minHeight: '60vh', marginBottom: 0 }}>
          <p style={{ color: '#888', marginBottom: '2rem' }}>
            Fetch the latest market news and synthesize them into a premium article using AI.
          </p>
          <AiGeneratorForm />
        </section>

        <section className="admin-section" style={{ marginBottom: 0 }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>Pending AI Drafts ({drafts.length})</h2>
          {drafts.length === 0 ? (
            <p style={{ color: '#666' }}>No drafts awaiting review.</p>
          ) : (
            <div className="admin-card-grid" style={{ gap: '1rem' }}>
              {drafts.map((draft: any) => (
                <div key={draft._id} className="admin-card" style={{ padding: '0', flexDirection: 'column', alignItems: 'flex-start', gap: '0', overflow: 'hidden' }}>
                  {draft.coverImageUrl ? (
                    <img
                      src={draft.coverImageUrl}
                      alt={draft.title}
                      style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '130px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1a1a1a' }}>
                      <span style={{ color: '#333', fontSize: '0.75rem' }}>No cover image</span>
                    </div>
                  )}
                  <div style={{ padding: '1rem' }}>
                    <div className="admin-card-content">
                      <h3 style={{ fontSize: '1rem', lineHeight: '1.4', marginBottom: '0.4rem' }}>{draft.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#888' }}>{draft.excerpt}</p>
                      <p style={{ color: '#4facfe', marginTop: '0.4rem', fontSize: '0.75rem' }}>{draft.aiProvenance}</p>
                    </div>
                    <div className="admin-card-actions" style={{ width: '100%', justifyContent: 'flex-start', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #1a1a1a' }}>
                      <form action={approveDraft}>
                        <input type="hidden" name="id" value={draft._id} />
                        <SubmitButton className="admin-btn admin-btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} pendingText="Publishing...">Publish</SubmitButton>
                      </form>
                      <form action={deleteDraft}>
                        <input type="hidden" name="id" value={draft._id} />
                        <SubmitButton className="admin-btn admin-btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} pendingText="Deleting...">Delete</SubmitButton>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
