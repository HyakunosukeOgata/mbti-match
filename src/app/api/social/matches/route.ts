import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { logAuditEvent, AuditAction, AuditTargetType } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limit';
import type { DbUserRow } from '@/lib/social';

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const rl = rateLimit('matches', authUser.id, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '操作太頻繁' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const matchId = typeof body?.matchId === 'string' ? body.matchId : null;
  const action = typeof body?.action === 'string' ? body.action : null;
  if (!matchId || !action) {
    return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
  }

  const adminClient = createServerClient();
  const { data: currentUserRow, error: currentUserError } = await adminClient
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single<DbUserRow>();

  if (currentUserError || !currentUserRow) {
    return NextResponse.json({ error: '找不到目前使用者' }, { status: 404 });
  }

  const { data: matchRow } = await adminClient
    .from('matches')
    .select('id, user1_id, user2_id, status')
    .eq('id', matchId)
    .maybeSingle();

  if (!matchRow || (matchRow.user1_id !== currentUserRow.id && matchRow.user2_id !== currentUserRow.id)) {
    return NextResponse.json({ error: '找不到對話' }, { status: 404 });
  }

  const currentPreferences = (currentUserRow.preferences || {}) as Record<string, unknown>;
  const hiddenMatchIds = new Set(Array.isArray(currentPreferences.hiddenMatchIds) ? currentPreferences.hiddenMatchIds as string[] : []);
  hiddenMatchIds.add(matchId);

  const { error: updateUserError } = await adminClient
    .from('users')
    .update({
      preferences: {
        ...currentPreferences,
        hiddenMatchIds: Array.from(hiddenMatchIds),
      },
    })
    .eq('id', currentUserRow.id);

  if (updateUserError) {
    return NextResponse.json({ error: '更新對話狀態失敗' }, { status: 500 });
  }

  if (action === 'leave') {
    return NextResponse.json({ ok: true });
  }

  if (action === 'block') {
    const otherUserId = matchRow.user1_id === currentUserRow.id ? matchRow.user2_id : matchRow.user1_id;
    const { error: blockError } = await adminClient
      .from('blocked_users')
      .upsert({ blocker_id: currentUserRow.id, blocked_id: otherUserId }, { onConflict: 'blocker_id,blocked_id' });

    if (blockError) {
      return NextResponse.json({ error: '封鎖失敗' }, { status: 500 });
    }

    await adminClient.from('matches').update({ status: 'removed' }).eq('id', matchId);

    // Audit log (non-blocking)
    logAuditEvent({
      actorUserId: currentUserRow.id,
      action: AuditAction.USER_BLOCK_USER,
      targetType: AuditTargetType.USER,
      targetId: otherUserId,
      metadata: { matchId },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 });
}