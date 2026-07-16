import { NextResponse } from 'next/server';
import { writeClient } from '@/sanity/write-client';
import { defineQuery } from 'next-sanity';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function POST(request: Request) {
  // 1. Authenticate Request
  const authHeader = request.headers.get('authorization');
  const secret = process.env.AI_INGEST_SECRET?.trim();

  if (!secret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();

    if (!payload.title || !payload.body) {
      return NextResponse.json({ error: 'Missing required fields: title or body' }, { status: 400 });
    }

    // 2. Resolve Author ("Bullish Hammer")
    const authorQuery = defineQuery(`*[_type == "author" && name == "Bullish Hammer"][0]`);
    let author = await writeClient.fetch(authorQuery);
    if (!author) {
      author = await writeClient.create({
        _type: 'author',
        name: 'Bullish Hammer',
        slug: { current: 'bullish-hammer' }
      });
    }

    // 3. Resolve Category
    const categoryName = payload.categoryName || 'General';
    const categoryQuery = defineQuery(`*[_type == "category" && title == $name][0]`);
    let category = await writeClient.fetch(categoryQuery, { name: categoryName });
    if (!category) {
      category = await writeClient.create({
        _type: 'category',
        title: categoryName,
        slug: { current: slugify(categoryName) }
      });
    }

    // 4. Resolve Tags
    const tagRefs: any[] = [];
    if (Array.isArray(payload.tags)) {
      for (const tagName of payload.tags) {
        const tagQuery = defineQuery(`*[_type == "tag" && title == $name][0]`);
        let tag = await writeClient.fetch(tagQuery, { name: tagName });
        if (!tag) {
          tag = await writeClient.create({
            _type: 'tag',
            title: tagName,
            slug: { current: slugify(tagName) }
          });
        }
        tagRefs.push({ _type: 'reference', _ref: tag._id, _key: tag._id });
      }
    }

    // 5. Upload Cover Image to Sanity (if provided)
    let coverImageRef: any = undefined;
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
          asset: { _type: 'reference', _ref: asset._id }
        };
        console.log('Cover image uploaded to Sanity:', asset._id);
      } catch (uploadErr: any) {
        console.warn('Failed to upload cover image to Sanity (non-fatal):', uploadErr.message);
      }
    }

    // 6. Construct Portable Text from raw text
    const portableTextBody = typeof payload.body === 'string'
      ? payload.body.split('\n\n').filter((p: string) => p.trim() !== '').map((p: string, idx: number) => ({
          _type: 'block',
          _key: `block-${idx}`,
          children: [{ _type: 'span', _key: `span-${idx}`, text: p }]
        }))
      : payload.body;

    // 7. Create Draft Article
    const article = await writeClient.create({
      _type: 'article',
      title: payload.title,
      slug: { current: slugify(payload.title) },
      excerpt: payload.excerpt,
      body: portableTextBody,
      coverImage: coverImageRef,
      author: { _type: 'reference', _ref: author._id },
      category: { _type: 'reference', _ref: category._id },
      tags: tagRefs.length > 0 ? tagRefs : undefined,
      seoTitle: payload.seoTitle || payload.title,
      seoDescription: payload.seoDescription || payload.excerpt,
      status: 'draft',
      publishedAt: new Date().toISOString(),
      aiProvenance: payload.aiProvenance || 'AI Generated via Ingestion API'
    });

    return NextResponse.json({
      success: true,
      message: 'Draft article created successfully',
      documentId: article._id
    }, { status: 201 });

  } catch (error: any) {
    console.error('Ingestion Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
