import { PortableText, defineQuery, type SanityDocument } from "next-sanity";
import { notFound } from "next/navigation";
import { client } from "@/sanity/client";

const POST_QUERY = defineQuery(
  `*[_type == "article" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
    _id, title, excerpt, body, publishedAt,
    author->{name},
    category->{title},
    tags[]->{title},
    currencyPairs[]->{name},
    seoTitle, seoDescription, aiProvenance,
    "coverImageUrl": coverImage.asset->url,
    sponsorPlacements {
      slot1->{sponsorName, destinationUrl, "imageUrl": image.asset->url, disclosureLabel},
      slot2->{sponsorName, destinationUrl, "imageUrl": image.asset->url, disclosureLabel}
    }
  }`
);

const options = { next: { revalidate: 60 } };

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch<SanityDocument | null>(POST_QUERY, { slug }, options);

  if (!post) return notFound();

  const slot1 = post.sponsorPlacements?.slot1;
  const slot2 = post.sponsorPlacements?.slot2;
  const coverImageUrl = post.coverImageUrl as string | undefined;

  return (
    <article className="article-detail" style={{ gridColumn: '1 / -1', maxWidth: '860px', margin: '0 auto' }}>
      
      {/* Cover Image Hero */}
      {coverImageUrl && (
        <div style={{
          width: '100%',
          height: '460px',
          overflow: 'hidden',
          borderRadius: '8px',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          <img
            src={coverImageUrl}
            alt={post.title as string}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block'
            }}
          />
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)',
            pointerEvents: 'none'
          }} />
        </div>
      )}

      <header className="article-header">
        <h1>{post.title as string}</h1>
        <div className="article-meta">
          <span>{(post.category as any)?.title}</span>
          <span>•</span>
          <span>By {(post.author as any)?.name}</span>
          <span>•</span>
          <span>{new Date(post.publishedAt as string).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Slot 1 — Top Banner */}
      {slot1 && slot1.imageUrl ? (
        <div className="ad-placement" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{slot1.disclosureLabel || 'Sponsored'}</span>
          <a href={slot1.destinationUrl} target="_blank" rel="noopener noreferrer">
            <img src={slot1.imageUrl} alt={slot1.sponsorName} style={{ maxHeight: '90px', objectFit: 'cover', border: '1px solid #333', borderRadius: '4px' }} />
          </a>
        </div>
      ) : (
        <div className="ad-placement" style={{ marginBottom: '2rem' }}>
          <span className="ad-label">Advertisement</span>
          <div style={{ height: '90px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #222', borderRadius: '4px' }}>
            <span style={{ color: '#444', fontSize: '0.85rem' }}>Standard Banner (728×90)</span>
          </div>
        </div>
      )}

      <div className="article-body">
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>

      {/* Slot 2 — Mid-Content */}
      {slot2 && slot2.imageUrl ? (
        <div className="ad-placement" style={{ margin: '2rem 0', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{slot2.disclosureLabel || 'Sponsored'}</span>
          <a href={slot2.destinationUrl} target="_blank" rel="noopener noreferrer">
            <img src={slot2.imageUrl} alt={slot2.sponsorName} style={{ maxHeight: '250px', objectFit: 'cover', border: '1px solid #333', borderRadius: '4px' }} />
          </a>
        </div>
      ) : (
        <div className="ad-placement" style={{ margin: '2rem 0' }}>
          <span className="ad-label">Advertisement</span>
          <div style={{ height: '250px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #222', borderRadius: '4px' }}>
            <span style={{ color: '#444', fontSize: '0.85rem' }}>Medium Rectangle (300×250)</span>
          </div>
        </div>
      )}
    </article>
  );
}
