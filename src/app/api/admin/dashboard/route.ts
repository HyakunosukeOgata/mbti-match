import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerClient } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';
import { loadProfilesByDbIds, mapDailyCardRow, mapMatchRow, type DbDailyCardRow, type DbLikeRow, type DbMatchRow, type DbMessageRow } from '@/lib/social';
import type { DailyCard, LikeAction, Match, UserProfile } from '@/lib/types';

interface AdminAnalyticsEvent {
  id: string;
  name: string;
  props?: Record<string, string | number | boolean>;
  ts: string;
}

interface AdminReport {
  id: string;
  reporterUserId: string;
  reporterName: string;
  reportedUserId: string;
  reportedName: string;
  reason: string;
  matchId: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'dismissed';
}

interface AdminDashboardData {
  users: UserProfile[];
  matches: Match[];
  likes: LikeAction[];
  dailyCards: DailyCard[];
  events: AdminAnalyticsEvent[];
  reports: AdminReport[];
}

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

function isAuthorized(req: NextRequest) {
  const code = req.headers.get('x-admin-code') || '';
  const expected = process.env.ADMIN_CODE_HASH || '';
  if (!code || !expected) return false;
  return hashCode(code) === expected;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit('admin-auth', ip, 10, 3600_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '請求太頻繁' }, { status: 429 });
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const adminClient = createServerClient();

  const [
    { data: userRows, error: usersError },
    { data: matchRows, error: matchesError },
    { data: messageRows, error: messagesError },
    { data: likeRows, error: likesError },
    { data: dailyCardRows, error: dailyCardsError },
    { data: reportRows, error: reportsError },
    { data: analyticsRows, error: analyticsError },
  ] = await Promise.all([
    adminClient.from('users').select('*').order('created_at', { ascending: false }),
    adminClient.from('matches').select('*').order('created_at', { ascending: false }),
    adminClient.from('messages').select('*').order('created_at', { ascending: true }),
    adminClient.from('likes').select('*').order('created_at', { ascending: false }),
    adminClient.from('daily_cards').select('*').eq('card_date', new Date().toISOString().slice(0, 10)).order('created_at', { ascending: false }),
    adminClient.from('reports').select('*').order('created_at', { ascending: false }),
    adminClient.from('analytics_events').select('id, event_name, properties, created_at').order('created_at', { ascending: false }).limit(200),
  ]);

  if (usersError || matchesError || messagesError || likesError || dailyCardsError || reportsError || analyticsError) {
    return NextResponse.json({ error: '載入後台資料失敗' }, { status: 500 });
  }

  const profileIds = [
    ...new Set([
      ...((userRows || []).map((row) => row.id)),
      ...((matchRows || []).flatMap((row) => [row.user1_id, row.user2_id])),
      ...((likeRows || []).flatMap((row) => [row.from_user_id, row.to_user_id])),
      ...((dailyCardRows || []).flatMap((row) => [row.user_id, row.target_user_id])),
      ...((reportRows || []).flatMap((row) => [row.reporter_id, row.reported_user_id])),
    ].filter(Boolean)),
  ];

  const profilesByDbId = await loadProfilesByDbIds(adminClient, profileIds);
  const users = (userRows || [])
    .map((row) => profilesByDbId.get(row.id))
    .filter((row): row is UserProfile => !!row);

  const messagesByMatchId = new Map<string, DbMessageRow[]>();
  for (const message of (messageRows || []) as DbMessageRow[]) {
    const existing = messagesByMatchId.get(message.match_id) || [];
    existing.push(message);
    messagesByMatchId.set(message.match_id, existing);
  }

  const matches = ((matchRows || []) as DbMatchRow[])
    .map((row) => {
      const currentUserDbId = row.user1_id;
      const currentUserAuthId = profilesByDbId.get(currentUserDbId)?.id || currentUserDbId;
      return mapMatchRow(row, currentUserDbId, currentUserAuthId, profilesByDbId, messagesByMatchId.get(row.id) || []);
    })
    .filter((row): row is Match => !!row);

  const likes = ((likeRows || []) as DbLikeRow[])
    .map((row) => {
      const fromProfile = profilesByDbId.get(row.from_user_id);
      const toProfile = profilesByDbId.get(row.to_user_id);
      if (!fromProfile || !toProfile) return null;

      return {
        id: row.id,
        fromUserId: fromProfile.id,
        toUserId: toProfile.id,
        topicAnswer: row.topic_answer || '',
        timestamp: row.created_at,
      } satisfies LikeAction;
    })
    .filter((row): row is NonNullable<typeof row> => !!row);

  const dailyCards = ((dailyCardRows || []) as DbDailyCardRow[])
    .map((row) => {
      const targetUser = profilesByDbId.get(row.target_user_id);
      if (!targetUser) return null;
      return mapDailyCardRow(row, targetUser);
    })
    .filter((row): row is DailyCard => !!row);

  const reports = (reportRows || []).map((row) => ({
    id: row.id,
    reporterUserId: profilesByDbId.get(row.reporter_id)?.id || row.reporter_id,
    reporterName: profilesByDbId.get(row.reporter_id)?.name || '未知用戶',
    reportedUserId: profilesByDbId.get(row.reported_user_id)?.id || row.reported_user_id,
    reportedName: profilesByDbId.get(row.reported_user_id)?.name || '未知用戶',
    reason: row.reason,
    matchId: row.match_id || '',
    timestamp: row.created_at,
    status: row.status,
  })) satisfies AdminReport[];

  const events = (analyticsRows || []).map((row) => ({
    id: row.id,
    name: row.event_name,
    props: (row.properties || undefined) as Record<string, string | number | boolean> | undefined,
    ts: row.created_at,
  })) satisfies AdminAnalyticsEvent[];

  const payload: AdminDashboardData = {
    users,
    matches,
    likes,
    dailyCards,
    events,
    reports,
  };

  return NextResponse.json(payload);
}

export async function PATCH(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit('admin-auth', ip, 10, 3600_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '請求太頻繁' }, { status: 429 });
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { reportId?: string; status?: 'reviewed' | 'dismissed' } | null;
  if (!body?.reportId || !body?.status) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  const adminClient = createServerClient();
  const { error } = await adminClient
    .from('reports')
    .update({ status: body.status })
    .eq('id', body.reportId);

  if (error) {
    return NextResponse.json({ error: '更新檢舉狀態失敗' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}