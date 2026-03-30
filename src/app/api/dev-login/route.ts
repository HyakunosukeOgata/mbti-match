import { NextRequest, NextResponse } from 'next/server';
import { ensureDemoLogin } from '@/lib/demo-admin-rest';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const testCode = req.headers.get('x-test-code') || '';
    const expected = process.env.NEXT_PUBLIC_ADMIN_HASH || '';
    if (!testCode || !expected) {
      return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }
    const { createHash, timingSafeEqual } = await import('crypto');
    const hashBuf = Buffer.from(createHash('sha256').update(testCode).digest('hex'));
    const expectedBuf = Buffer.from(expected);
    if (hashBuf.length !== expectedBuf.length || !timingSafeEqual(hashBuf, expectedBuf)) {
      return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }
  }

  const body = await req.json().catch(() => null);
  const rawName = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!rawName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    return NextResponse.json(await ensureDemoLogin(rawName));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create demo user' },
      { status: 500 }
    );
  }
}