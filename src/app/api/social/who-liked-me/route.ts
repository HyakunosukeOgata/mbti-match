import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { loadProfilesByDbIds } from '@/lib/social';

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
    return NextResponse.json({ likers: [] });
  }

  // Get users who liked me but I haven't matched with
  const { data: likeRows } = await adminClient
    .from('likes')
    .select('from_user_id, topic_answer, created_at')
    .eq('to_user_id', currentUserRow.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!likeRows || likeRows.length === 0) {
    return NextResponse.json({ likers: [] });
  }

  // Exclude already-matched user pairs
  const { data: matchRows } = await adminClient
    .from('matches')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${currentUserRow.id},user2_id.eq.${currentUserRow.id}`)
    .neq('status', 'removed');

  const matchedUserIds = new Set<string>();
  for (const m of matchRows || []) {
    matchedUserIds.add(m.user1_id === currentUserRow.id ? m.user2_id : m.user1_id);
  }

  const unmatched = (likeRows as { from_user_id: string; topic_answer: string; created_at: string }[])
    .filter(r => !matchedUserIds.has(r.from_user_id));

  if (unmatched.length === 0) {
    return NextResponse.json({ likers: [] });
  }

  const likerIds = unmatched.map(r => r.from_user_id);
  const profiles = await loadProfilesByDbIds(adminClient, likerIds);

  const likers = unmatched.map(r => {
    const profile = profiles.get(r.from_user_id);
    if (!profile) return null;
    return {
      id: profile.id,
      dbId: profile.dbId,
      name: profile.name,
      photo: profile.photos[0] || null,
      age: profile.age,
      hideAge: profile.hideAge,
      likedAt: r.created_at,
    };
  }).filter(Boolean);

  return NextResponse.json({ likers });
}
