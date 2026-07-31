import { writeClient } from '@/sanity/write-client';
import { defineQuery } from 'next-sanity';

export interface IngestPayload {
  title?: string;
  body?: unknown;
  excerpt?: string;
  categoryName?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  aiProvenance?: string;
  bannerImageUrl?: string;
  coverImageBase64?: string;
  coverImageMimeType?: string;
}

export function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Creates a draft article in Sanity from an AI-generated payload.
 *
 * This is the single source of truth for ingestion. Both the public
 * `/api/ingest` route and the admin server action call it directly, so no
 * self-referential HTTP request is needed (that pattern breaks on Vercel when
 * Deployment Protection is enabled).
 */
export async function ingestArticle(payload: IngestPayload) {
  if (!payload?.title || !payload?.body) {
    throw new Error('Missing required fields: title or body');
  }

  // 1. Resolve Author ("Bullish Hammer")
  const authorQuery = defineQuery(`*[_type == "author" && name == "Bullish Hammer"][0]`);
  let author = await writeClient.fetch(authorQuery);
  if (!author) {
    author = await writeClient.create({
      _type: 'author',
      name: 'Bullish Hammer',
      slug: { current: 'bullish-hammer' },
    });
  }

  // 2. Resolve Category
  const categoryName = payload.categoryName || 'General';
  const categoryQuery = defineQuery(`*[_type == "category" && title == $name][0]`);
  let category = await writeClient.fetch(categoryQuery, { name: categoryName });
  if (!category) {
    category = await writeClient.create({
      _type: 'category',
      title: categoryName,
      slug: { current: slugify(categoryName) },
    });
  }

  // 3. Resolve Tags
  const tagRefs: Array<Record<string, string>> = [];
  if (Array.isArray(payload.tags)) {
    for (const tagName of payload.tags) {
      const tagQuery = defineQuery(`*[_type == "tag" && title == $name][0]`);
      let tag = await writeClient.fetch(tagQuery, { name: tagName });
      if (!tag) {
        tag = await writeClient.create({
          _type: 'tag',
          title: tagName,
          slug: { current: slugify(tagName) },
        });
      }
      tagRefs.push({ _type: 'reference', _ref: tag._id, _key: tag._id });
    }
  }

  // 4. Upload Cover Image to Sanity (if provided)
  let coverImageRef: Record<string, unknown> | undefined;
  if (payload.coverImageBase64) {
    try {
      const mimeType = payload.coverImageMimeType || 'image/jpeg';
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const filename = `ai-cover-${slugify(payload.title).substring(0, 50)}.${ext}`;
      const buffer = Buffer.from(payload.coverImageBase64, 'base64');
      const asset = await writeClient.assets.upload('image', buffer, {
        filename,
        contentType: mimeType,
      });
      coverImageRef = {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
      };
    } catch (uploadErr) {
      console.warn(
        'Failed to upload cover image to Sanity (non-fatal):',
        uploadErr instanceof Error ? uploadErr.message : uploadErr
      );
    }
  }

  // 5. Construct Portable Text from raw text
  const portableTextBody = typeof payload.body === 'string'
    ? payload.body.split('\n\n').filter((p: string) => p.trim() !== '').map((p: string, idx: number) => ({
        _type: 'block',
        _key: `block-${idx}`,
        children: [{ _type: 'span', _key: `span-${idx}`, text: p }],
      }))
    : payload.body;

  // 6. Create Draft Article
  const article = await writeClient.create({
    _type: 'article',
    title: payload.title,
    slug: { current: slugify(payload.title) },
    excerpt: payload.excerpt,
    body: portableTextBody,
    coverImage: coverImageRef,
    bannerImageUrl: payload.bannerImageUrl,
    author: { _type: 'reference', _ref: author._id },
    category: { _type: 'reference', _ref: category._id },
    tags: tagRefs.length > 0 ? tagRefs : undefined,
    seoTitle: payload.seoTitle || payload.title,
    seoDescription: payload.seoDescription || payload.excerpt,
    status: 'draft',
    publishedAt: new Date().toISOString(),
    aiProvenance: payload.aiProvenance || 'AI Generated via Ingestion API',
  });

  return article;
}
