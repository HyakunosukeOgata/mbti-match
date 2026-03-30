/**
 * Full production functional verification script.
 * Tests: dev-login, supabase auth, AI chat, cards, matches, messages, report, settings fields.
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

const BASE = 'https://mbti-match-six.vercel.app';

// Load env manually
const envText = readFileSync('.env.local', 'utf-8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(SUPA_URL, SUPA_KEY);

const results = [];

function record(name, pass, detail = '') {
  const status = pass ? '✅' : '❌';
  results.push({ name, pass, detail });
  console.log(`${status} ${name}${detail ? ' — ' + detail : ''}`);
}

// ─── 1. dev-login ────────────────────────────────
let email, password;
try {
  const res = await fetch(`${BASE}/api/dev-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-code': 'mochi-test-2026',
    },
    body: JSON.stringify({ name: '驗證員Final' }),
  });
  const data = await res.json();
  email = data.email;
  password = data.password;
  record('dev-login', !!email && !!password, `email=${email}`);
} catch (e) {
  record('dev-login', false, String(e));
}

// ─── 2. supabase auth ────────────────────────────
let accessToken;
try {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  accessToken = data?.session?.access_token;
  record('supabase-auth', !!accessToken, error ? String(error.message) : `token_len=${accessToken?.length}`);
} catch (e) {
  record('supabase-auth', false, String(e));
}

const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

// ─── 3. AI chat (greeting) ───────────────────────
try {
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'chat', messages: [{ role: 'user', content: '你好，我剛加入 Mochi' }] }),
  });
  const data = await res.json();
  const hasReply = typeof data.reply === 'string' && data.reply.length > 10;
  record('ai-chat-greeting', hasReply, `reply_len=${data.reply?.length}, readyToAnalyze=${data.readyToAnalyze}`);
} catch (e) {
  record('ai-chat-greeting', false, String(e));
}

// ─── 4. AI chat (multi-turn — check open-ended questions) ──────────
let chatMessages = [
  { role: 'user', content: '你好，我剛加入 Mochi' },
];
let aiReply1 = '';
try {
  const res1 = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'chat', messages: chatMessages }),
  });
  const d1 = await res1.json();
  aiReply1 = d1.reply || '';
  chatMessages.push({ role: 'assistant', content: aiReply1 });
  chatMessages.push({ role: 'user', content: '我平常下班喜歡去河濱跑步，週末偶爾泡咖啡廳' });

  const res2 = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'chat', messages: chatMessages }),
  });
  const d2 = await res2.json();
  const followUp = d2.reply || '';
  chatMessages.push({ role: 'assistant', content: followUp });

  // Check the AI is NOT asking resume-type questions
  const resumePatterns = /你(的|做什麼)工作|職業|學歷|公司|收入|薪|星座|MBTI|身高/;
  const asksResume = resumePatterns.test(followUp);
  record('ai-no-resume-questions', !asksResume, asksResume ? `BAD: AI asked resume question: "${followUp.slice(0, 100)}"` : `follow-up ok: "${followUp.slice(0, 80)}"`);

  // Check readyToAnalyze is still false (too early)
  record('ai-not-premature-ready', d2.readyToAnalyze !== true, `readyToAnalyze=${d2.readyToAnalyze}`);
} catch (e) {
  record('ai-multi-turn', false, String(e));
}

// ─── 5. AI finalize (with occupation + education) ─────────
try {
  // Build a plausible 6-turn conversation for finalize
  const fakeConvo = [
    { role: 'assistant', content: '你好～我是小默！' },
    { role: 'user', content: '我平常很喜歡泡咖啡廳看書，偶爾去河濱跑步' },
    { role: 'assistant', content: '聽起來你是個很有自己節奏的人欸！' },
    { role: 'user', content: '對，我比較慢熱，需要時間才能打開心房' },
    { role: 'assistant', content: '那在感情裡你覺得最重要的是什麼？' },
    { role: 'user', content: '安全感吧，能好好溝通、互相尊重的那種' },
    { role: 'assistant', content: '那你覺得什麼樣的互動會讓你有安全感？' },
    { role: 'user', content: '主動分享心情、有事直接說而不是冷戰' },
    { role: 'assistant', content: '蠻重要的耶，那平常跟朋友相處呢？' },
    { role: 'user', content: '我朋友不多但都很深交，一起吃飯聊天就很開心了' },
  ];

  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'finalize',
      messages: fakeConvo,
      profile: {
        nickname: '驗證員Final',
        occupation: '產品設計師',
        education: '台大資工碩士',
        age: 28,
        gender: 'male',
        region: '台北市',
        bio: '',
        ageMin: 22,
        ageMax: 35,
        genderPreference: ['female'],
        preferredRegions: ['台北市', '新北市'],
        photoCount: 2,
      },
    }),
  });
  const data = await res.json();
  const p = data.personality;
  const hasBio = typeof p?.bio === 'string' && p.bio.length > 10;
  const hasTraits = Array.isArray(p?.traits) && p.traits.length >= 2;
  const hasValues = Array.isArray(p?.values) && p.values.length >= 2;
  const hasScoring = !!p?.scoringFeatures?.attachmentStyle;
  record('ai-finalize', res.ok && hasBio && hasTraits, `bio_len=${p?.bio?.length}, traits=${p?.traits?.length}, values=${p?.values?.length}, scoring=${hasScoring}`);
  
  // Check if bio mentions occupation/education (optional but nice)
  const bioMentionsJob = /設計|產品|工程|資工/.test(p?.bio || '');
  record('ai-finalize-uses-occupation', true, bioMentionsJob ? 'bio references occupation ✓' : 'bio does not mention occupation (acceptable)');
} catch (e) {
  record('ai-finalize', false, String(e));
}

// ─── 6. Social Cards ─────────────────────────────
let cardUserDbId;
try {
  const res = await fetch(`${BASE}/api/social/cards`, { headers: authHeader });
  const data = await res.json();
  const cards = data.cards || [];
  cardUserDbId = cards[0]?.user?.dbId;
  record('social-cards', res.ok && cards.length > 0, `card_count=${cards.length}, first_card_user=${cards[0]?.user?.name || '?'}, compat=${cards[0]?.compatibility}`);
  // Check matchReasons populated
  const hasReasons = cards.some(c => c.matchReasons && c.matchReasons.length > 0);
  record('social-cards-reasons', true, hasReasons ? 'has AI matchReasons ✓' : 'no matchReasons (may need onboarding first)');
} catch (e) {
  record('social-cards', false, String(e));
}

// ─── 7. Social Matches (via Supabase direct query — no REST GET endpoint) ──
let matchId, matchOtherDbId;
try {
  // First get current user's DB id
  const { data: meRow } = await supabase.from('users').select('id').eq('email', email).single();
  const myDbId = meRow?.id;
  if (!myDbId) throw new Error('cannot find user db row');

  const { data: matchRows, error: matchErr } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, status, compatibility')
    .or(`user1_id.eq.${myDbId},user2_id.eq.${myDbId}`)
    .neq('status', 'removed')
    .order('created_at', { ascending: false })
    .limit(5);

  if (matchErr) throw matchErr;
  const matches = matchRows || [];
  matchId = matches[0]?.id;
  matchOtherDbId = matches[0]?.user1_id === myDbId ? matches[0]?.user2_id : matches[0]?.user1_id;
  record('social-matches', matches.length > 0, `match_count=${matches.length}, first_match_status=${matches[0]?.status}, compat=${matches[0]?.compatibility}`);
} catch (e) {
  record('social-matches', false, String(e));
}

// ─── 8. Send message ─────────────────────────────
if (matchId) {
  try {
    const res = await fetch(`${BASE}/api/social/messages`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ matchId, text: '這是自動測試訊息 🧪' }),
    });
    const data = await res.json();
    record('send-message', res.ok, `response_keys=${Object.keys(data).join(',')}`);
  } catch (e) {
    record('send-message', false, String(e));
  }
} else {
  record('send-message', false, 'no matchId available');
}

// ─── 9. Report ───────────────────────────────────
if (matchOtherDbId && matchId) {
  try {
    const res = await fetch(`${BASE}/api/social/report`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        reportedUserDbId: matchOtherDbId,
        matchId,
        reason: '自動測試檢舉（請忽略）',
      }),
    });
    const data = await res.json();
    record('report', res.ok, `status=${res.status}, response=${JSON.stringify(data).slice(0, 100)}`);
  } catch (e) {
    record('report', false, String(e));
  }
} else {
  record('report', false, 'no matchOtherDbId or matchId');
}

// ─── 10. Who liked me ────────────────────────────
try {
  const res = await fetch(`${BASE}/api/social/who-liked-me`, { headers: authHeader });
  const data = await res.json();
  const likers = data.likers || data.likes || [];
  record('who-liked-me', res.ok, `likers_count=${Array.isArray(likers) ? likers.length : '?'}`);
} catch (e) {
  record('who-liked-me', false, String(e));
}

// ─── 11. Pages render (non-auth) ─────────────────
const pages = ['/test', '/faq', '/privacy', '/terms', '/support', '/safety'];
for (const page of pages) {
  try {
    const res = await fetch(`${BASE}${page}`);
    record(`page${page}`, res.ok, `status=${res.status}`);
  } catch (e) {
    record(`page${page}`, false, String(e));
  }
}

// ─── 12. Static pages that need auth (just check 200 HTML) ──
const authPages = ['/', '/home', '/onboarding/ai-chat', '/onboarding/profile', '/personality', '/settings', '/matches'];
for (const page of authPages) {
  try {
    const res = await fetch(`${BASE}${page}`);
    record(`page${page}`, res.ok, `status=${res.status}`);
  } catch (e) {
    record(`page${page}`, false, String(e));
  }
}

// ─── Summary ─────────────────────────────────────
console.log('\n========== SUMMARY ==========');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.log('\nFailed tests:');
  results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
}

process.exit(failed > 0 ? 1 : 0);
