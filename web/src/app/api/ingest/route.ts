import { NextResponse } from 'next/server';
import { ingestArticle } from '@/lib/ingest';

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
    const article = await ingestArticle(payload);

    return NextResponse.json({
      success: true,
      message: 'Draft article created successfully',
      documentId: article._id,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Ingestion Error:', error);

    const isValidation = message.startsWith('Missing required fields');
    return NextResponse.json({ error: message }, { status: isValidation ? 400 : 500 });
  }
}
