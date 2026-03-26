import { NextRequest, NextResponse } from 'next/server';
import { parseStoredMessage, serializeImageMessage } from '@/lib/chat-message';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { rateLimit } from '@/lib/rate-limit';
import { checkMessageSafety } from '@/lib/safety/message-safety';
import { analyzeTextSafety, getSafetyErrorMessage } from '@/lib/safety/text-safety';
import type { DbUserRow } from '@/lib/social';

function buildDemoReply(senderName: string, text: string) {
  const cannedReplies = [
    `收到 ${senderName} 的訊息了，我也想多認識你一點。`,
    '這個開場不錯，我通常會先聊最近讓自己開心的小事。',
    '我也有同感，感覺我們可以從這個話題繼續聊下去。',
    '哈哈，這題我會想知道你背後真正的理由。',
  ];

  if (!text) {
    return cannedReplies[0];
  }

  if (text.includes('你好') || text.includes('嗨')) {
    return `嗨 ${senderName}，很高興配對到你。`;
  }

  return cannedReplies[text.length % cannedReplies.length];
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const rl = rateLimit('message', authUser.id, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '訊息發送太頻繁，請稍後再試' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const matchId = typeof body?.matchId === 'string' ? body.matchId : null;
  const action = typeof body?.action === 'string' ? body.action : 'send';
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const kind = body?.kind === 'image' ? 'image' : 'text';
  const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : '';

  if (!matchId || (action === 'send' && !text && kind !== 'image')) {
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

  if (!matchRow || matchRow.status !== 'active' || (matchRow.user1_id !== currentUserRow.id && matchRow.user2_id !== currentUserRow.id)) {
    return NextResponse.json({ error: '無法傳送訊息' }, { status: 403 });
  }

  // Text safety checks (from Kin) — block inappropriate content & off-platform solicitation
  if (action === 'send' && text && kind === 'text') {
    const msgSafety = checkMessageSafety(text);
    if (!msgSafety.allowed) {
      return NextResponse.json({ error: msgSafety.error }, { status: 400 });
    }
    const textSafety = analyzeTextSafety(text, { maxLength: 2000, fieldName: '訊息' });
    const safetyError = getSafetyErrorMessage(textSafety);
    if (safetyError) {
      return NextResponse.json({ error: safetyError }, { status: 400 });
    }
  }

  if (action === 'mark-read') {
    const { error: readError } = await adminClient
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .neq('sender_id', currentUserRow.id)
      .is('read_at', null);

    if (readError) {
      return NextResponse.json({ error: '標記已讀失敗' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  let storedText = text;
  if (kind === 'image') {
    const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${authUser.id}/chat/${matchId}/`;
    if (!imageUrl || !imageUrl.startsWith(allowedPrefix)) {
      return NextResponse.json({ error: '圖片路徑無效' }, { status: 400 });
    }
    // Validate URL structure to prevent path traversal
    try {
      const parsed = new URL(imageUrl);
      if (parsed.pathname.includes('..') || decodeURIComponent(parsed.pathname).includes('..')) {
        return NextResponse.json({ error: '圖片路徑無效' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: '圖片路徑無效' }, { status: 400 });
    }

    const { data: photoConsentRow } = await adminClient
      .from('photo_consents')
      .select('status')
      .eq('match_id', matchId)
      .maybeSingle();

    if (photoConsentRow?.status !== 'approved') {
      return NextResponse.json({ error: '尚未開啟照片交換權限' }, { status: 403 });
    }

    storedText = serializeImageMessage({
      url: imageUrl,
      caption: text,
    });
  }

  const { data: messageRow, error: messageError } = await adminClient
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: currentUserRow.id,
      text: storedText,
    })
    .select('id, text, created_at')
    .single();

  if (messageError || !messageRow) {
    return NextResponse.json({ error: '訊息送出失敗' }, { status: 500 });
  }

  const otherUserId = matchRow.user1_id === currentUserRow.id ? matchRow.user2_id : matchRow.user1_id;
  const { data: otherUserRow } = await adminClient
    .from('users')
    .select('id, auth_id, name')
    .eq('id', otherUserId)
    .maybeSingle<Pick<DbUserRow, 'id' | 'auth_id' | 'name'>>();

  await adminClient.from('notifications').insert({
    user_id: otherUserId,
    type: 'message',
    title: `${currentUserRow.name || '有人'} 傳來新訊息`,
    body: kind === 'image' ? (text ? `傳來一張照片：${text.slice(0, 60)}` : '傳來一張照片') : text.slice(0, 80),
    link: `/chat/${matchId}`,
    read: false,
  });

  if (otherUserRow?.id && !otherUserRow.auth_id) {
    const replyText = buildDemoReply(currentUserRow.name || '你', text);
    await adminClient.from('messages').insert({
      match_id: matchId,
      sender_id: otherUserId,
      text: replyText,
      read_at: null,
    });

    await adminClient.from('notifications').insert({
      user_id: currentUserRow.id,
      type: 'message',
      title: `${otherUserRow.name || '對方'} 傳來新訊息`,
      body: replyText.slice(0, 80),
      link: `/chat/${matchId}`,
      read: false,
    });
  }

  const parsed = parseStoredMessage(messageRow.text);

  return NextResponse.json({
    message: {
      id: messageRow.id,
      senderId: authUser.id,
      type: parsed.type,
      text: parsed.text,
      imageUrl: parsed.imageUrl,
      timestamp: messageRow.created_at,
      readAt: null,
    },
  });
}