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

      <div className="ai-generator-layout">
        <section className="admin-section ai-primary-section">
          <p className="ai-generator-copy">
            Fetch the latest market news and synthesize them into a premium article using AI.
          </p>
          <AiGeneratorForm />
        </section>

        <section className="admin-section ai-side-section">
          <h2 className="ai-side-title">Pending AI Drafts ({drafts.length})</h2>
          {drafts.length === 0 ? (
            <p className="admin-empty-state">No drafts awaiting review.</p>
          ) : (
            <div className="admin-card-grid">
              {drafts.map((draft: any) => (
                <div key={draft._id} className="admin-card admin-draft-card">
                  {draft.coverImageUrl ? (
                    <img
                      src={draft.coverImageUrl}
                      alt={draft.title}
                      className="admin-draft-image"
                    />
                  ) : (
                    <div className="admin-draft-placeholder">
                      <span>No cover image</span>
                    </div>
                  )}
                  <div className="admin-draft-body">
                    <div className="admin-card-content">
                      <h3 className="admin-draft-title">{draft.title}</h3>
                      <p className="admin-draft-excerpt">{draft.excerpt}</p>
                      <p className="admin-provenance">{draft.aiProvenance}</p>
                    </div>
                    <div className="admin-card-actions admin-card-actions-bordered">
                      <form action={approveDraft}>
                        <input type="hidden" name="id" value={draft._id} />
                        <SubmitButton className="admin-btn admin-btn-success admin-btn-compact" pendingText="Publishing...">Publish</SubmitButton>
                      </form>
                      <form action={deleteDraft}>
                        <input type="hidden" name="id" value={draft._id} />
                        <SubmitButton className="admin-btn admin-btn-danger admin-btn-compact" pendingText="Deleting...">Delete</SubmitButton>
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
