import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { rateLimit } from '@/lib/rate-limit';

// GET: list blocked users
export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const rl = rateLimit('unblock-list', authUser.id, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: '操作太頻繁' }, { status: 429 });

  const adminClient = createServerClient();

  const { data: currentUser } = await adminClient
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!currentUser) return NextResponse.json({ error: '找不到使用者' }, { status: 404 });

  const { data: blockedRows } = await adminClient
    .from('blocked_users')
    .select('id, blocked_id, created_at')
    .eq('blocker_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (!blockedRows || blockedRows.length === 0) {
    return NextResponse.json({ blocked: [] });
  }

  const blockedIds = blockedRows.map(r => r.blocked_id);
  const { data: users } = await adminClient
    .from('users')
    .select('id, name, photos:ai_personality')
    .in('id', blockedIds);

  const userMap = new Map((users || []).map(u => [u.id, u]));
  const blocked = blockedRows.map(r => {
    const u = userMap.get(r.blocked_id);
    return {
      blockId: r.id,
      userId: r.blocked_id,
      name: u?.name || '已刪除用戶',
      blockedAt: r.created_at,
    };
  });

  return NextResponse.json({ blocked });
}

// DELETE: unblock a user
export async function DELETE(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const rl = rateLimit('unblock', authUser.id, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: '操作太頻繁' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const blockedUserId = typeof body?.blockedUserId === 'string' ? body.blockedUserId : null;
  if (!blockedUserId) return NextResponse.json({ error: '缺少參數' }, { status: 400 });

  const adminClient = createServerClient();

  const { data: currentUser } = await adminClient
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!currentUser) return NextResponse.json({ error: '找不到使用者' }, { status: 404 });

  const { error: deleteError } = await adminClient
    .from('blocked_users')
    .delete()
    .eq('blocker_id', currentUser.id)
    .eq('blocked_id', blockedUserId);

  if (deleteError) return NextResponse.json({ error: '解除封鎖失敗' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
