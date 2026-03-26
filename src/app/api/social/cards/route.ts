import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { calculateCompatibility, getFullScoreResult, getDailyMatches, passesBasicFilters } from '@/lib/matching';
import { generateFallbackReasons } from '@/lib/ai/recommendation-reasons';
import { loadProfilesByDbIds, mapDailyCardRow, mapDbUserToProfile, pickRandomTopics, type DbDailyCardRow, type DbUserRow } from '@/lib/social';
import { rateLimit } from '@/lib/rate-limit';

async function loadCardsForUser(adminClient: ReturnType<typeof createServerClient>, userDbId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existingRows } = await adminClient
    .from('daily_cards')
    .select('*')
    .eq('user_id', userDbId)
    .eq('card_date', today)
    .order('created_at', { ascending: true });

  if (!existingRows || existingRows.length === 0) {
    return [];
  }

  const targetProfiles = await loadProfilesByDbIds(
    adminClient,
    (existingRows as DbDailyCardRow[]).map((row) => row.target_user_id)
  );

  return (existingRows as DbDailyCardRow[])
    .map((row) => {
      const target = targetProfiles.get(row.target_user_id);
      return target ? mapDailyCardRow(row, target) : null;
    })
    .filter((card): card is NonNullable<typeof card> => !!card);
}

async function buildCards(adminClient: ReturnType<typeof createServerClient>, authUserId: string) {
  const { data: meRow, error: meError } = await adminClient
    .from('users')
    .select('*')
    .eq('auth_id', authUserId)
    .single<DbUserRow>();

  if (meError || !meRow) {
    return { error: '找不到使用者', status: 404 as const };
  }

  const mePhotos = await adminClient
    .from('user_photos')
    .select('url, sort_order')
    .eq('user_id', meRow.id)
    .order('sort_order', { ascending: true });

  const meProfile = mapDbUserToProfile(meRow, (mePhotos.data || []).map((photo: { url: string }) => photo.url));

  const today = new Date().toISOString().slice(0, 10);
  const [skippedRes, blockedRes, blockedByRes, likesRes, incomingLikesRes, matchesRes, candidatesRes, exposureRes, seenRes] = await Promise.all([
    adminClient.from('skipped_users').select('skipped_user_id').eq('user_id', meRow.id),
    adminClient.from('blocked_users').select('blocked_id').eq('blocker_id', meRow.id),
    adminClient.from('blocked_users').select('blocker_id').eq('blocked_id', meRow.id),
    adminClient.from('likes').select('to_user_id').eq('from_user_id', meRow.id),
    adminClient.from('likes').select('from_user_id').eq('to_user_id', meRow.id),
    adminClient.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${meRow.id},user2_id.eq.${meRow.id}`).neq('status', 'removed'),
    adminClient.from('users').select('*').eq('onboarding_complete', true).eq('profile_visible', true).neq('id', meRow.id).limit(500),
    adminClient.from('daily_cards').select('target_user_id').eq('card_date', today),
    adminClient.from('daily_cards').select('target_user_id').eq('user_id', meRow.id),
  ]);

  const matchedIds = new Set<string>();
  for (const match of matchesRes.data || []) {
    matchedIds.add(match.user1_id === meRow.id ? match.user2_id : match.user1_id);
  }

  const excludeIds = [
    ...(skippedRes.data || []).map((row) => row.skipped_user_id),
    ...(blockedRes.data || []).map((row) => row.blocked_id),
    ...(blockedByRes.data || []).map((row) => row.blocker_id),
    ...(likesRes.data || []).map((row) => row.to_user_id),
    ...(seenRes.data || []).map((row) => row.target_user_id),
    ...matchedIds,
  ];
  const excludeSet = new Set(excludeIds);

  const candidateRows = (candidatesRes.data || []) as DbUserRow[];
  const candidateProfiles = await loadProfilesByDbIds(adminClient, candidateRows.map((row) => row.id));
  const candidateRowsByDbId = new Map(candidateRows.map((row) => [row.id, row]));
  const exposureCounts = new Map<string, number>();
  for (const row of exposureRes.data || []) {
    const targetUserId = row.target_user_id as string | undefined;
    if (!targetUserId) continue;
    const candidateRow = candidateRowsByDbId.get(targetUserId);
    if (candidateRow?.auth_id == null) continue;
    exposureCounts.set(targetUserId, (exposureCounts.get(targetUserId) || 0) + 1);
  }
  const incomingLikeIds = new Set((incomingLikesRes.data || []).map((row) => row.from_user_id as string));
  const prioritizedIncomingProfiles = candidateRows
    .filter((row) => incomingLikeIds.has(row.id))
    .map((row) => candidateProfiles.get(row.id))
    .filter((profile): profile is NonNullable<typeof profile> => !!profile)
    .filter((profile) => passesBasicFilters(meProfile, profile))
    .filter((profile) => !excludeSet.has(profile.id) && !excludeSet.has(profile.dbId || ''))
    .filter((profile) => {
      const sourceRow = candidateRowsByDbId.get(profile.dbId || profile.id);
      if (sourceRow?.auth_id == null) {
        return true;
      }
      return (exposureCounts.get(profile.dbId || profile.id) || 0) < 10;
    })
    .sort((a, b) => calculateCompatibility(meProfile, b) - calculateCompatibility(meProfile, a));

  const fallbackDemoProfiles = candidateRows
    .filter((row) => row.auth_id == null)
    .map((row) => candidateProfiles.get(row.id))
    .filter((profile): profile is NonNullable<typeof profile> => !!profile)
    .filter((profile) => passesBasicFilters(meProfile, profile))
    .filter((profile) => !excludeSet.has(profile.id) && !excludeSet.has(profile.dbId || ''))
    .sort((a, b) => calculateCompatibility(meProfile, b) - calculateCompatibility(meProfile, a));

  const topMatches = getDailyMatches(
    meProfile,
    candidateRows
      .map((row) => candidateProfiles.get(row.id))
      .filter((profile): profile is NonNullable<typeof profile> => !!profile),
    [...excludeSet].map((id) => candidateProfiles.get(id)?.id || id),
    exposureCounts
  );
  const mergedMatches = [...prioritizedIncomingProfiles, ...topMatches]
    .filter((profile, index, arr) => arr.findIndex((item) => item.id === profile.id) === index)
    .slice(0, 5);
  const finalMatches = (mergedMatches.length > 0 ? mergedMatches : fallbackDemoProfiles)
    .filter((profile, index, arr) => arr.findIndex((item) => item.id === profile.id) === index)
    .slice(0, 5);

  const topics = pickRandomTopics(Math.max(finalMatches.length, 1));
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Check if any target already has a card pointing back at me — reuse the same topic
  const targetDbIds = finalMatches.map((p) => p.dbId).filter((id): id is string => !!id);
  const existingPairCards = new Map<string, { topic_id: string; topic_text: string }>();
  if (targetDbIds.length > 0) {
    const { data: reverseCards } = await adminClient
      .from('daily_cards')
      .select('user_id, topic_id, topic_text')
      .in('user_id', targetDbIds)
      .eq('target_user_id', meRow.id)
      .eq('card_date', today);
    for (const rc of (reverseCards || []) as { user_id: string; topic_id: string; topic_text: string }[]) {
      existingPairCards.set(rc.user_id, { topic_id: rc.topic_id, topic_text: rc.topic_text });
    }
  }

  // Re-check: another concurrent request may have already built cards
  const preCheck = await loadCardsForUser(adminClient, meRow.id);
  if (preCheck.length > 0) {
    return { cards: preCheck };
  }

  await adminClient.from('daily_cards').delete().eq('user_id', meRow.id).eq('card_date', today);

  if (finalMatches.length > 0) {
    await adminClient.from('daily_cards').insert(
      finalMatches.map((profile, index) => {
        const pairTopic = profile.dbId ? existingPairCards.get(profile.dbId) : undefined;
        const result = getFullScoreResult(meProfile, profile);
        const { breakdown, matchedSignals, cautionSignals } = result;
        const fallbackReasons = generateFallbackReasons(matchedSignals, cautionSignals);
        return {
          user_id: meRow.id,
          target_user_id: profile.dbId,
          compatibility: result.totalScore,
          topic_id: pairTopic?.topic_id || topics[index]?.id || topics[0].id,
          topic_text: pairTopic?.topic_text || topics[index]?.text || topics[0].text,
          expires_at: expiresAt,
          liked: false,
          skipped: false,
          card_date: today,
          scoring_breakdown: breakdown,
          matched_signals: matchedSignals,
          caution_signals: cautionSignals,
          recommendation_reasons: fallbackReasons,
        };
      })
    );
  }

  return { cards: await loadCardsForUser(adminClient, meRow.id) };
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const rl = rateLimit('cards-get', authUser.id, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '請求太頻繁' }, { status: 429 });
  }

  const adminClient = createServerClient();
  const { data: meRow } = await adminClient.from('users').select('id').eq('auth_id', authUser.id).single();
  if (!meRow) {
    return NextResponse.json({ cards: [] });
  }

  const cards = await loadCardsForUser(adminClient, meRow.id);
  if (cards.length > 0) {
    return NextResponse.json({ cards });
  }

  const result = await buildCards(adminClient, authUser.id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const rl = rateLimit('cards-post', authUser.id, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '請求太頻繁' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const adminClient = createServerClient();
  const { data: meRow, error: meError } = await adminClient.from('users').select('id').eq('auth_id', authUser.id).single();
  if (meError || !meRow) {
    return NextResponse.json({ error: '找不到使用者' }, { status: 404 });
  }
  const today = new Date().toISOString().slice(0, 10);

  if (body?.targetUserDbId && body?.action === 'skip') {
    await adminClient.from('skipped_users').upsert({ user_id: meRow.id, skipped_user_id: body.targetUserDbId }, { onConflict: 'user_id,skipped_user_id' });
    await adminClient.from('daily_cards').update({ skipped: true }).eq('user_id', meRow.id).eq('target_user_id', body.targetUserDbId).eq('card_date', today);
    return NextResponse.json({ cards: await loadCardsForUser(adminClient, meRow.id) });
  }

  if (body?.targetUserDbId && body?.action === 'undo') {
    return NextResponse.json({ error: '今日略過後不會再出現' }, { status: 409 });
  }

  if (body?.force) {
    return NextResponse.json({ cards: await loadCardsForUser(adminClient, meRow.id) });
  }

  const existingCards = await loadCardsForUser(adminClient, meRow.id);
  if (existingCards.length > 0) {
    return NextResponse.json({ cards: existingCards });
  }

  const result = await buildCards(adminClient, authUser.id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}