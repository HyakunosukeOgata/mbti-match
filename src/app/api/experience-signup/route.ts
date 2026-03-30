import { NextRequest, NextResponse } from 'next/server';
import { ensureDemoLogin } from '@/lib/demo-admin-rest';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit('experience-signup', ip, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '請求太頻繁，請稍後再試' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const rawName = typeof body?.name === 'string' ? body.name.trim() : '';

  if (rawName.length < 1 || rawName.length > 20) {
    return NextResponse.json({ error: '請輸入 1 到 20 個字的暱稱' }, { status: 400 });
  }

  try {
    return NextResponse.json(await ensureDemoLogin(rawName));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '體驗註冊失敗' },
      { status: 500 }
    );
  }
}