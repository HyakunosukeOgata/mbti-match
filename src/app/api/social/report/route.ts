import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { rateLimit } from '@/lib/rate-limit';
import { evaluateEscalation } from '@/lib/report-escalation';
import { logAuditEvent, AuditAction, AuditTargetType } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const rl = rateLimit('report', authUser.id, 5, 600_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '操作太頻繁，請稍後再試' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const reportedUserDbId = typeof body?.reportedUserDbId === 'string' ? body.reportedUserDbId : null;
  const matchId = typeof body?.matchId === 'string' ? body.matchId : null;
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : null;

  if (!reportedUserDbId || !reason) {
    return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
  }

  const adminClient = createServerClient();

  const { data: currentUserRow } = await adminClient
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!currentUserRow) {
    return NextResponse.json({ error: '找不到使用者' }, { status: 404 });
  }

  if (currentUserRow.id === reportedUserDbId) {
    return NextResponse.json({ error: '無法檢舉自己' }, { status: 400 });
  }

  const { data: report, error: insertError } = await adminClient
    .from('reports')
    .insert({
      reporter_id: currentUserRow.id,
      reported_user_id: reportedUserDbId,
      match_id: matchId,
      reason,
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json({ error: '送出檢舉失敗' }, { status: 500 });
  }

  // Audit log (non-blocking)
  logAuditEvent({
    actorUserId: currentUserRow.id,
    action: AuditAction.USER_REPORT_USER,
    targetType: AuditTargetType.REPORT,
    targetId: report.id,
    metadata: { reportedUserDbId, reason },
  });

  // Evaluate auto-escalation (non-blocking)
  evaluateEscalation(reportedUserDbId).catch(() => {});

  return NextResponse.json({ ok: true, reportId: report.id });
}
