import { NextResponse } from 'next/server';
import { resetDemoTestState } from '@/lib/demo-admin-rest';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const result = await resetDemoTestState();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Reset failed' }, { status: 500 });
  }
}