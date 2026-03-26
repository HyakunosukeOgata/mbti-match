import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { calculateCompatibility, getFullScoreResult } from '@/lib/matching';
import { generateFallbackReasons } from '@/lib/ai/recommendation-reasons';
import { generateConversationStarters } from '@/lib/ai/conversation-starters';
import { loadProfilesByDbIds, type DbLikeRow, type DbUserRow } from '@/lib/social';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const rl = rateLimit('like', authUser.id, 50, 3600_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '操作太頻繁，請稍後再試' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const targetUserDbId = typeof body?.targetUserDbId === 'string' ? body.targetUserDbId : null;
  const topicAnswer = typeof body?.topicAnswer === 'string' ? body.topicAnswer.trim() : '';
  if (!targetUserDbId || !topicAnswer) {
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

  const { data: targetUserRow, error: targetUserError } = await adminClient
    .from('users')
    .select('*')
    .eq('id', targetUserDbId)
    .single<DbUserRow>();

  if (targetUserError || !targetUserRow) {
    return NextResponse.json({ error: '操作失敗' }, { status: 400 });
  }

  if (currentUserRow.id === targetUserDbId) {
    return NextResponse.json({ error: '無法喜歡自己' }, { status: 400 });
  }

  await adminClient.from('likes').upsert({
    from_user_id: currentUserRow.id,
    to_user_id: targetUserDbId,
    topic_answer: topicAnswer,
  }, { onConflict: 'from_user_id,to_user_id' });

  await adminClient
    .from('daily_cards')
    .update({ liked: true })
    .eq('user_id', currentUserRow.id)
    .eq('target_user_id', targetUserDbId)
    .eq('card_date', new Date().toISOString().slice(0, 10));

  const { data: reciprocalLike } = await adminClient
    .from('likes')
    .select('*')
    .eq('from_user_id', targetUserDbId)
    .eq('to_user_id', currentUserRow.id)
    .maybeSingle<DbLikeRow>();

  const currentProfileMap = await loadProfilesByDbIds(adminClient, [currentUserRow.id, targetUserRow.id]);
  const currentProfile = currentProfileMap.get(currentUserRow.id);
  const targetProfile = currentProfileMap.get(targetUserRow.id);
  if (!currentProfile || !targetProfile) {
    return NextResponse.json({ matched: false });
  }

  if (!reciprocalLike) {
    await adminClient.from('notifications').insert({
      user_id: targetUserRow.id,
      type: 'like',
      title: '有人喜歡你',
      body: `${currentProfile.name} 對你的回答很有共鳴`,
      link: '/home',
      read: false,
    });
    return NextResponse.json({ matched: false });
  }

  const [user1Id, user2Id] = [currentUserRow.id, targetUserRow.id].sort();
  const { data: existingMatch } = await adminClient
    .from('matches')
    .select('id')
    .eq('user1_id', user1Id)
    .eq('user2_id', user2Id)
    .maybeSingle();

  let matchId = existingMatch?.id as string | undefined;
  if (!matchId) {
    // Try to get the topic from either user's card
    const { data: cardRow } = await adminClient
      .from('daily_cards')
      .select('topic_id, topic_text')
      .eq('user_id', currentUserRow.id)
      .eq('target_user_id', targetUserRow.id)
      .eq('card_date', new Date().toISOString().slice(0, 10))
      .maybeSingle();

    // Fallback: check the other direction
    const topicId = cardRow?.topic_id || undefined;
    const topicText = cardRow?.topic_text || undefined;
    let finalTopicId = topicId;
    let finalTopicText = topicText;
    if (!finalTopicId) {
      const { data: reverseCard } = await adminClient
        .from('daily_cards')
        .select('topic_id, topic_text')
        .eq('user_id', targetUserRow.id)
        .eq('target_user_id', currentUserRow.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      finalTopicId = reverseCard?.topic_id || 'daily-topic';
      finalTopicText = reverseCard?.topic_text || '從你們今天的回答開始聊吧';
    }

    const scoreResult = getFullScoreResult(currentProfile, targetProfile);
    const { breakdown, matchedSignals, cautionSignals } = scoreResult;
    const reasons = generateFallbackReasons(matchedSignals, cautionSignals);

    const { data: insertedMatch, error: matchError } = await adminClient
      .from('matches')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        topic_id: finalTopicId || 'daily-topic',
        topic_text: finalTopicText || '從你們今天的回答開始聊吧',
        topic_category: '破冰',
        topic_answers: {
          [currentProfile.id]: topicAnswer,
          [targetProfile.id]: reciprocalLike.topic_answer || '',
        },
        compatibility: scoreResult.totalScore,
        status: 'active',
        scoring_breakdown: breakdown,
        matched_signals: matchedSignals,
        caution_signals: cautionSignals,
        recommendation_reasons: reasons,
      })
      .select('id')
      .single();

    if (matchError || !insertedMatch) {
      return NextResponse.json({ error: '建立配對失敗' }, { status: 500 });
    }
    matchId = insertedMatch.id;

    // Generate AI conversation starters (non-blocking)
    generateConversationStarters(currentProfile, targetProfile)
      .then(async (starters) => {
        await adminClient.from('conversation_starters').insert({
          match_id: matchId,
          user_id: currentUserRow.id,
          starters,
        });
      })
      .catch(() => { /* starters are nice-to-have, don't fail */ });
  }

  await adminClient.from('notifications').insert([
    {
      user_id: currentUserRow.id,
      type: 'match',
      title: '配對成功',
      body: `你和 ${targetProfile.name} 已成功配對`,
      link: `/chat/${matchId}`,
      read: false,
    },
    {
      user_id: targetUserRow.id,
      type: 'match',
      title: '配對成功',
      body: `你和 ${currentProfile.name} 已成功配對`,
      link: `/chat/${matchId}`,
      read: false,
    },
  ]);

  return NextResponse.json({ matched: true, matchId });
}