import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { loadProfilesByDbIds, type DbUserRow } from '@/lib/social';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const rl = rateLimit('profile-view', authUser.id, 100, 3600_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => null);
  const targetUserDbId = typeof body?.targetUserDbId === 'string' ? body.targetUserDbId : null;
  if (!targetUserDbId) {
    return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
  }

  const adminClient = createServerClient();
  const { data: currentUserRow } = await adminClient
    .from('users')
    .select('id, name')
    .eq('auth_id', authUser.id)
    .single<{ id: string; name: string }>();

  if (!currentUserRow || currentUserRow.id === targetUserDbId) {
    return NextResponse.json({ ok: true });
  }

  // Upsert profile view (update timestamp if already viewed)
  await adminClient.from('profile_views').upsert(
    { viewer_id: currentUserRow.id, viewed_user_id: targetUserDbId },
    { onConflict: 'viewer_id,viewed_user_id' }
  );

  // Create notification for the viewed user (only once per day per viewer)
  const today = new Date().toISOString().slice(0, 10);
  const { data: existingNotif } = await adminClient
    .from('notifications')
    .select('id')
    .eq('user_id', targetUserDbId)
    .eq('type', 'profile_view')
    .gte('created_at', `${today}T00:00:00Z`)
    .like('body', `%${currentUserRow.name}%`)
    .maybeSingle();

  if (!existingNotif) {
    await adminClient.from('notifications').insert({
      user_id: targetUserDbId,
      type: 'profile_view',
      title: '有人看了你的檔案',
      body: `${currentUserRow.name} 瀏覽了你的個人資料`,
      link: '/notifications',
      read: false,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const adminClient = createServerClient();
  const { data: currentUserRow } = await adminClient
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single<{ id: string }>();

  if (!currentUserRow) {
    return NextResponse.json({ viewers: [] });
  }

  const { data: viewRows } = await adminClient
    .from('profile_views')
    .select('viewer_id, created_at')
    .eq('viewed_user_id', currentUserRow.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!viewRows || viewRows.length === 0) {
    return NextResponse.json({ viewers: [] });
  }

  const viewerIds = viewRows.map((r: { viewer_id: string }) => r.viewer_id);
  const profiles = await loadProfilesByDbIds(adminClient, viewerIds);

  const viewers = viewRows.map((r: { viewer_id: string; created_at: string }) => {
    const profile = profiles.get(r.viewer_id);
    if (!profile) return null;
    return {
      id: profile.id,
      dbId: profile.dbId,
      name: profile.name,
      photo: profile.photos[0] || null,
      viewedAt: r.created_at,
    };
  }).filter(Boolean);

  return NextResponse.json({ viewers });
}
