import { client } from "@/sanity/client";
import { defineQuery } from "next-sanity";
import SubmitButton from "../SubmitButton";
import { updatePlacements } from "../actions";

export const metadata = {
  title: "Manage Sponsor Placements - Bullish Hammer Admin",
};

const ARTICLES_QUERY = defineQuery(
  `*[_type == "article"] | order(_createdAt desc){
    _id, title, status, _createdAt,
    sponsorPlacements {
      slot1->{_id, sponsorName},
      slot2->{_id, sponsorName}
    }
  }`
);

const SPONSORS_QUERY = defineQuery(
  `*[_type == "sponsorCampaign"]{
    _id, sponsorName
  }`
);

export default async function SponsorsPage() {
  const articles = await client.fetch(ARTICLES_QUERY, {}, { next: { revalidate: 0 } });
  const sponsors = await client.fetch(SPONSORS_QUERY, {}, { next: { revalidate: 0 } });

  const published = articles.filter((a: any) => a.status === 'published');
  const drafts = articles.filter((a: any) => a.status === 'draft');

  function renderArticleList(list: any[], title: string) {
    if (list.length === 0) return <p style={{ color: '#666' }}>No {title.toLowerCase()} found.</p>;

    return (
      <div className="admin-card-grid" style={{ gap: '1rem' }}>
        {list.map((article: any) => (
          <form action={updatePlacements} key={article._id} className="admin-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem', padding: '1.5rem' }}>
            <input type="hidden" name="articleId" value={article._id} />
            
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>{article.title}</h3>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>ID: {article._id}</p>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Top Banner Slot (728x90)</label>
                <select name="slot1" className="admin-input" defaultValue={article.sponsorPlacements?.slot1?._id || "none"}>
                  <option value="none">-- No Sponsor (Default Ad) --</option>
                  {sponsors.map((s: any) => (
                    <option key={s._id} value={s._id}>{s.sponsorName}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Mid-Content Slot (300x250)</label>
                <select name="slot2" className="admin-input" defaultValue={article.sponsorPlacements?.slot2?._id || "none"}>
                  <option value="none">-- No Sponsor (Default Ad) --</option>
                  {sponsors.map((s: any) => (
                    <option key={s._id} value={s._id}>{s.sponsorName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <SubmitButton className="admin-btn admin-btn-success" style={{ padding: '0.5rem 1.5rem', width: 'auto' }} pendingText="Saving...">Save Placements</SubmitButton>
            </div>
          </form>
        ))}
      </div>
    );
  }

  return (
    <>
      <header className="admin-header">
        <h1>Manage Ad Placements</h1>
      </header>

      <section className="admin-section">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>Published Articles ({published.length})</h2>
        {renderArticleList(published, "Published Articles")}
      </section>

      <section className="admin-section">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>Drafts ({drafts.length})</h2>
        {renderArticleList(drafts, "Drafts")}
      </section>
    </>
  );
}
