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

async function generateCoverImage(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "true") return;

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  if (!id || !title) return;

  try {
    const imagePromptText = `Cinematic premium editorial financial news cover image for article: "${title}". Professional photography, dark dramatic lighting, financial markets, 4K quality.`;
    const seed = Math.floor(Math.random() * 2000000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePromptText)}?width=1280&height=720&model=sana&nologo=true&enhance=true&seed=${seed}`;

    const imgRes = await fetch(pollinationsUrl, { signal: AbortSignal.timeout(45000) });
    if (imgRes.ok) {
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
      const ext = mimeType.includes('png') ? 'png' : 'jpg';

      const asset = await writeClient.assets.upload('image', buffer, {
        filename: `cover-${Date.now()}.${ext}`,
        contentType: mimeType,
      });

      await writeClient.patch(id).set({
        coverImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
      }).commit();

      revalidatePath("/admin");
      revalidatePath("/");
    }
  } catch (error) {
    console.error("Manual image generation failed:", error);
  }
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
import ImageGeneratorButton from "./ImageGeneratorButton";

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
                    <ImageGeneratorButton articleId={draft._id} title={draft.title} excerpt={draft.excerpt} />
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

      {/* --- PUBLISHED ARTICLES --- */}
      <section className="admin-section">
        <h2>Published Articles ({published.length})</h2>
        {published.length === 0 ? (
          <p className="admin-empty-state">No published articles yet.</p>
        ) : (
          <div className="admin-list">
            {published.map((article: any) => (
              <div key={article._id} className="admin-list-row">
                {article.coverImageUrl ? (
                  <img
                    src={article.coverImageUrl}
                    alt={article.title}
                    className="admin-list-thumb"
                  />
                ) : (
                  <div className="admin-thumb-placeholder">
                    <span>No image</span>
                  </div>
                )}
                <div className="admin-list-content">
                  <p className="admin-list-title">{article.title}</p>
                  <p className="admin-list-meta">
                    {article.category?.title && <span>{article.category.title}</span>}
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="admin-list-actions">
                  <ImageGeneratorButton articleId={article._id} title={article.title} excerpt={article.excerpt} />
                  <a
                    href={`/article/${article.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                  >
                    View
                  </a>
                  <form action={deleteArticle}>
                    <input type="hidden" name="id" value={article._id} />
                    <SubmitButton className="admin-btn admin-btn-danger admin-btn-compact" pendingText="Deleting...">Delete</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- ACTIVE SPONSORS --- */}
      <section className="admin-section">
        <div className="admin-section-toolbar">
          <h2>Active Sponsor Campaigns ({sponsors.length})</h2>
          <a href="/studio/structure/sponsorCampaign" target="_blank" rel="noreferrer" className="admin-btn admin-btn-secondary admin-btn-compact">
            Manage in Sanity
          </a>
        </div>
        <div className="admin-sponsor-grid">
          {sponsors.map((sponsor: any) => (
            <div key={sponsor._id} className="admin-sponsor-card">
              <h3>{sponsor.sponsorName}</h3>
              {sponsor.adCopy && <p className="admin-sponsor-copy">{sponsor.adCopy}</p>}
              <a href={sponsor.destinationUrl} target="_blank" rel="noreferrer">{sponsor.destinationUrl}</a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
