import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { writeClient } from "@/sanity/write-client";
import { client } from "@/sanity/client";
import { defineQuery } from "next-sanity";

// --- SERVER ACTIONS ---

async function approveDraft(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "true") return;
  const id = formData.get("id") as string;
  await writeClient.patch(id).set({ status: 'published' }).commit();
  revalidatePath("/admin");
  revalidatePath("/");
}

async function deleteDraft(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "true") return;
  const id = formData.get("id") as string;
  await writeClient.delete(id);
  revalidatePath("/admin");
}

async function deleteArticle(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "true") return;
  const id = formData.get("id") as string;
  await writeClient.delete(id);
  revalidatePath("/admin");
  revalidatePath("/");
}

// --- QUERIES ---

const DRAFTS_QUERY = defineQuery(
  `*[_type == "article" && status == "draft"] | order(_createdAt desc){
    _id, title, excerpt, _createdAt, aiProvenance,
    "coverImageUrl": coverImage.asset->url
  }`
);

const PUBLISHED_QUERY = defineQuery(
  `*[_type == "article" && status == "published"] | order(publishedAt desc){
    _id, title, excerpt, publishedAt,
    category->{title},
    "coverImageUrl": coverImage.asset->url,
    "slug": slug.current
  }`
);

const SPONSORS_QUERY = defineQuery(
  `*[_type == "sponsorCampaign"]{
    _id, sponsorName, destinationUrl, startDate, endDate, adCopy
  }`
);

import LoginForm from "./LoginForm";
import SubmitButton from "./SubmitButton";

// --- COMPONENT ---

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const isAuthenticated = session?.value === "true";

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const drafts = await client.fetch(DRAFTS_QUERY, {}, { next: { revalidate: 0 } });
  const published = await client.fetch(PUBLISHED_QUERY, {}, { next: { revalidate: 0 } });
  const sponsors = await client.fetch(SPONSORS_QUERY, {}, { next: { revalidate: 0 } });

  return (
    <>
      <header className="admin-header">
        <h1>Dashboard</h1>
      </header>

      {/* --- PENDING DRAFTS --- */}
      <section className="admin-section">
        <h2>Pending AI Drafts ({drafts.length})</h2>
        {drafts.length === 0 ? (
          <p style={{ color: '#666' }}>No drafts awaiting review.</p>
        ) : (
          <div className="admin-card-grid">
            {drafts.map((draft: any) => (
              <div key={draft._id} className="admin-card" style={{ flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                {draft.coverImageUrl ? (
                  <img
                    src={draft.coverImageUrl}
                    alt={draft.title}
                    style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '160px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1f1f1f' }}>
                    <span style={{ color: '#333', fontSize: '0.8rem' }}>No cover image</span>
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <div className="admin-card-content">
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.4' }}>{draft.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>{draft.excerpt}</p>
                    <p style={{ color: '#4facfe', fontSize: '0.75rem' }}>{draft.aiProvenance}</p>
                  </div>
                  <div className="admin-card-actions" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #1a1a1a' }}>
                    <form action={approveDraft}>
                      <input type="hidden" name="id" value={draft._id} />
                      <SubmitButton className="admin-btn admin-btn-success" style={{ padding: '0.5rem 1rem' }} pendingText="Publishing...">Publish</SubmitButton>
                    </form>
                    <form action={deleteDraft}>
                      <input type="hidden" name="id" value={draft._id} />
                      <SubmitButton className="admin-btn admin-btn-danger" style={{ padding: '0.5rem 1rem' }} pendingText="Deleting...">Delete</SubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- PUBLISHED ARTICLES --- */}
      <section className="admin-section">
        <h2>Published Articles ({published.length})</h2>
        {published.length === 0 ? (
          <p style={{ color: '#666' }}>No published articles yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {published.map((article: any) => (
              <div key={article._id} style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
              }}>
                {article.coverImageUrl ? (
                  <img
                    src={article.coverImageUrl}
                    alt={article.title}
                    style={{ width: '80px', height: '54px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: '80px', height: '54px', background: '#1a1a1a', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#333', fontSize: '0.65rem' }}>No img</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{article.title}</p>
                  <p style={{ fontSize: '0.78rem', color: '#666', margin: '0.2rem 0 0' }}>
                    {article.category?.title && <span style={{ marginRight: '0.5rem', color: '#888' }}>{article.category.title}</span>}
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <a
                    href={`/article/${article.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto', textDecoration: 'none' }}
                  >
                    View
                  </a>
                  <form action={deleteArticle}>
                    <input type="hidden" name="id" value={article._id} />
                    <SubmitButton className="admin-btn admin-btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }} pendingText="Deleting...">Delete</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- ACTIVE SPONSORS --- */}
      <section className="admin-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Active Sponsor Campaigns ({sponsors.length})</h2>
          <a href="http://localhost:3333/structure/sponsorCampaign" target="_blank" rel="noreferrer" className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem 1rem', width: 'auto', textDecoration: 'none' }}>
            Manage in Sanity
          </a>
        </div>
        <div className="admin-sponsor-grid">
          {sponsors.map((sponsor: any) => (
            <div key={sponsor._id} className="admin-sponsor-card">
              <h3>{sponsor.sponsorName}</h3>
              {sponsor.adCopy && <p style={{ margin: '0.75rem 0', color: '#aaa', fontSize: '0.95rem', lineHeight: '1.5' }}>"{sponsor.adCopy}"</p>}
              <a href={sponsor.destinationUrl} target="_blank" rel="noreferrer">{sponsor.destinationUrl}</a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
