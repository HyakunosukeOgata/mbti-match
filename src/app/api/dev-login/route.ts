import { NextRequest, NextResponse } from 'next/server';
import { ensureDemoLogin } from '@/lib/demo-admin-rest';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
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