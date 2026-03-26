import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { rateLimit } from '@/lib/rate-limit';

type AnalyticsPayload = {
  name?: string;
  props?: Record<string, string | number | boolean>;
  ts?: number;
};

const VALID_EVENTS = new Set([
  'page_view', 'login', 'logout', 'onboarding_start', 'onboarding_complete',
  'mbti_reset', 'ai_chat_reset', 'card_like', 'card_skip', 'match_created', 'chat_message_sent',
  'chat_image_sent', 'profile_updated', 'pwa_install_prompt', 'pwa_installed',
  'apple_sign_in', 'report_user',
]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit('analytics', ip, 100, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '請求太頻繁' }, { status: 429 });
  }

  const body = await req.json().catch(() => null) as AnalyticsPayload | null;
  const eventName = typeof body?.name === 'string' ? body.name.trim() : '';

  if (!eventName || !VALID_EVENTS.has(eventName)) {
    return NextResponse.json({ error: '無效的事件名稱' }, { status: 400 });
  }

  const authUser = await getAuthenticatedUser(req);
  const adminClient = createServerClient();

  let userDbId: string | null = null;
  if (authUser?.id) {
    const { data: meRow } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .maybeSingle();
    userDbId = meRow?.id || null;
  }

  const { error } = await adminClient.from('analytics_events').insert({
    user_id: userDbId,
    event_name: eventName,
    properties: body?.props || {},
    created_at: body?.ts ? new Date(body.ts).toISOString() : new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: '事件寫入失敗' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}