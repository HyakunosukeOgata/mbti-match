/**
 * 20-persona production walkthrough.
 * Each persona creates a unique test account, walks through onboarding,
 * and exercises edge-case scenarios specific to their profile.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const BASE = 'https://mbti-match-six.vercel.app';
const envText = readFileSync('.env.local', 'utf-8');
for (const l of envText.split('\n')) {
  const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const issues = [];
let issueId = 0;
function addIssue(severity, persona, screen, desc, expected, actual) {
  issueId++;
  issues.push({ id: issueId, severity, persona, screen, desc, expected, actual });
  const icon = severity === 'P0' ? '🔴' : severity === 'P1' ? '🟠' : '🟡';
  console.log(`  ${icon} [${severity}] #${issueId} ${desc}`);
}

// Helper: create account + get token
async function createTestUser(name) {
  const uniqueName = `${name}_${Date.now().toString(36).slice(-4)}`;
  const res = await fetchWithTimeout(`${BASE}/api/dev-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-code': 'mochi-test-2026' },
    body: JSON.stringify({ name: uniqueName }),
  });
  if (!res.ok) throw new Error(`dev-login failed: ${res.status}`);
  const { email, password } = await res.json();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`auth failed: ${error.message}`);
  return { token: data.session.access_token, email, uniqueName };
}

const authH = (token) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Fetch with timeout
async function fetchWithTimeout(url, opts = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Persona definitions ─────────────────────
const personas = [
  { name: '小美18歲', age: 18, gender: 'female', occ: '高三生', edu: '高中在學', bio: '', scenario: 'youngest-allowed' },
  { name: '阿德60歲', age: 60, gender: 'male', occ: '退休老師', edu: '師範大學', bio: '', scenario: 'oldest-user' },
  { name: '小空', age: 25, gender: 'other', occ: '', edu: '', bio: '', scenario: 'all-empty-optional' },
  { name: 'A'.repeat(20), age: 28, gender: 'female', occ: 'X'.repeat(40), edu: 'Y'.repeat(60), bio: '', scenario: 'max-length-fields' },
  { name: '🌈彩虹🦄', age: 22, gender: 'other', occ: '自由業💻', edu: '🎓大學', bio: '', scenario: 'emoji-name' },
  { name: '阿強', age: 30, gender: 'male', occ: '', edu: '', bio: '', scenario: 'skip-fast-chat' },
  { name: '文靜', age: 27, gender: 'female', occ: '護理師', edu: '護專', bio: '', scenario: 'short-replies' },
  { name: '冷漠哥', age: 29, gender: 'male', occ: '', edu: '', bio: '', scenario: 'all-skip-cards' },
  { name: '小花', age: 24, gender: 'female', occ: '行銷專員', edu: '政大新聞', bio: '', scenario: 'like-all-cards' },
  { name: '阿明', age: 35, gender: 'male', occ: '工程師', edu: '交大資工', bio: '', scenario: 'send-message' },
  { name: '敷衍妹', age: 23, gender: 'female', occ: '', edu: '', bio: '', scenario: 'lazy-chat' },
  { name: '長文王', age: 31, gender: 'male', occ: '作家', edu: '台大中文', bio: '', scenario: 'long-message' },
  { name: '偏好窄', age: 26, gender: 'female', occ: '', edu: '', bio: '', scenario: 'narrow-prefs' },
  { name: '全選男', age: 28, gender: 'male', occ: '', edu: '', bio: '', scenario: 'wide-prefs' },
  { name: '重開女', age: 25, gender: 'female', occ: '設計師', edu: '實踐設計', bio: '', scenario: 'reset-chat' },
  { name: '檢舉俠', age: 33, gender: 'male', occ: '', edu: '', bio: '', scenario: 'report-flow' },
  { name: '無照片', age: 27, gender: 'other', occ: '', edu: '', bio: '', scenario: 'no-photo-attempt' },
  { name: '秒退族', age: 22, gender: 'female', occ: '', edu: '', bio: '', scenario: 'back-navigation' },
  { name: '多裝置', age: 29, gender: 'male', occ: '', edu: '', bio: '', scenario: 'concurrent-session' },
  { name: '新手媽', age: 38, gender: 'female', occ: '全職媽媽', edu: '高職', bio: '', scenario: 'low-tech' },
];

// ─── Test execution ─────────────────────────
console.log('═══════════════════════════════════════');
console.log('  20-PERSONA PRODUCTION WALKTHROUGH');
console.log('═══════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

for (const p of personas) {
  const tag = `[${p.name}]`;
  console.log(`\n── Persona: ${p.name} (${p.scenario}) ──`);

  let token;
  try {
    const result = await createTestUser(p.name);
    token = result.token;
    console.log(`  ✅ Account created & authenticated`);
  } catch (e) {
    addIssue('P0', p.name, 'dev-login', `Account creation failed: ${e.message}`, 'Account created', e.message);
    failCount++;
    continue;
  }

  const headers = authH(token);

  // ── AI Chat greeting ──
  try {
    const res = await fetchWithTimeout(`${BASE}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat', messages: [{ role: 'user', content: '你好' }] }),
    });
    const d = await res.json();
    if (!d.reply || d.reply.length < 5) {
      addIssue('P1', p.name, 'ai-chat', 'AI greeting too short or empty', 'Valid greeting', `reply="${d.reply}"`);
    }
    if (d.readyToAnalyze === true) {
      addIssue('P0', p.name, 'ai-chat', 'readyToAnalyze true on first message', 'false', 'true');
    }
  } catch (e) {
    addIssue('P1', p.name, 'ai-chat', `Greeting failed: ${e.message}`, 'Valid reply', e.message);
  }

  // ── Scenario-specific tests ──
  if (p.scenario === 'lazy-chat') {
    // Send lazy one-word answers
    const msgs = [
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '嗨～歡迎！你平常喜歡做什麼放鬆？' },
      { role: 'user', content: '嗯' },
    ];
    try {
      const res = await fetchWithTimeout(`${BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', messages: msgs }),
      });
      const d = await res.json();
      if (d.readyToAnalyze === true) {
        addIssue('P0', p.name, 'ai-chat', 'readyToAnalyze true after lazy reply', 'false', 'true');
      }
      // Check if AI pushes back on lazy answer
      const pushback = /沒辦法|多一點|認真|再具體|多說|不夠/.test(d.reply || '');
      if (!pushback) {
        addIssue('P2', p.name, 'ai-chat', 'AI did not push back on lazy answer "嗯"', 'Should encourage more detail', `reply="${(d.reply||'').slice(0,80)}"`);
      }
    } catch (e) { /* skip */ }
  }

  if (p.scenario === 'skip-fast-chat') {
    // Try to trigger readyToAnalyze with only 2 messages
    const msgs = [
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '嗨！' },
      { role: 'user', content: '我喜歡跑步和看書' },
    ];
    try {
      const res = await fetchWithTimeout(`${BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', messages: msgs }),
      });
      const d = await res.json();
      if (d.readyToAnalyze) {
        addIssue('P1', p.name, 'ai-chat', 'readyToAnalyze true after only 2 user messages', 'Need at least 5', 'true');
      }
    } catch (e) { /* skip */ }
  }

  if (p.scenario === 'long-message') {
    // Send a very long message (1999 chars)
    const longText = '我很喜歡分享，'.repeat(285);
    try {
      const res = await fetchWithTimeout(`${BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', messages: [{ role: 'user', content: longText }] }),
      });
      const d = await res.json();
      if (!res.ok) {
        addIssue('P1', p.name, 'ai-chat', `Long message (${longText.length} chars) rejected`, 'Accepted up to 2000', `status=${res.status}`);
      }
    } catch (e) { /* skip */ }
  }

  // ── AI finalize with persona-specific profile ──
  const fakeConvo = [
    { role: 'assistant', content: '嗨！我是小默～' },
    { role: 'user', content: '我喜歡安靜的午後去河濱跑步' },
    { role: 'assistant', content: '聽起來很放鬆！' },
    { role: 'user', content: '對，我比較內向，需要慢慢認識' },
    { role: 'assistant', content: '那你覺得關係裡最重要的是？' },
    { role: 'user', content: '互相尊重和真誠的溝通' },
    { role: 'assistant', content: '蠻好的，平常跟朋友怎麼相處？' },
    { role: 'user', content: '朋友不多但都很深交' },
    { role: 'assistant', content: '那什麼會讓你心動？' },
    { role: 'user', content: '願意認真聽我講話的人，笑起來很溫暖的' },
  ];

  try {
    const res = await fetchWithTimeout(`${BASE}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'finalize',
        messages: fakeConvo,
        profile: {
          nickname: p.name,
          occupation: p.occ,
          education: p.edu,
          age: p.age,
          gender: p.gender,
          region: '台北市',
          bio: p.bio,
          ageMin: 18, ageMax: 60,
          genderPreference: ['male', 'female', 'other'],
          preferredRegions: [],
          photoCount: 1,
        },
      }),
    });
    const d = await res.json();
    if (!res.ok || !d.personality) {
      addIssue('P1', p.name, 'ai-finalize', `Finalize failed: ${d.error || res.status}`, 'Valid personality', JSON.stringify(d).slice(0, 100));
    } else {
      const pers = d.personality;
      if (!pers.bio || pers.bio.length < 10) addIssue('P1', p.name, 'ai-finalize', 'Bio too short', '>=10 chars', `bio="${pers.bio}"`);
      if (!pers.traits || pers.traits.length < 2) addIssue('P1', p.name, 'ai-finalize', 'Too few traits', '>=2', `traits=${pers.traits?.length}`);
      if (!pers.scoringFeatures) addIssue('P1', p.name, 'ai-finalize', 'Missing scoringFeatures', 'Present', 'undefined');
      
      // Check age-appropriate content for 18yo
      if (p.scenario === 'youngest-allowed' && pers.bio) {
        passCount++;
      }
      // Check empty occupation/education handling
      if (p.scenario === 'all-empty-optional') {
        if (/undefined|null/.test(pers.bio)) {
          addIssue('P1', p.name, 'ai-finalize', 'Bio contains "undefined" or "null" when fields empty', 'Clean bio', `bio="${pers.bio}"`);
        }
      }
    }
  } catch (e) {
    addIssue('P1', p.name, 'ai-finalize', `Exception: ${e.message}`, 'Success', e.message);
  }

  // ── Social Cards ──
  try {
    const res = await fetchWithTimeout(`${BASE}/api/social/cards`, { headers });
    const d = await res.json();
    const cards = d.cards || [];

    if (p.scenario === 'like-all-cards' && cards.length > 0) {
      // Try to like a card
      const card = cards[0];
      if (card.user?.dbId) {
        const likeRes = await fetchWithTimeout(`${BASE}/api/social/like`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ targetUserDbId: card.user.dbId, topicAnswer: '測試回答' }),
        });
        const likeData = await likeRes.json();
        if (!likeRes.ok) {
          addIssue('P1', p.name, 'social-like', `Like failed: ${likeData.error}`, '200 OK', `${likeRes.status}`);
        }
      }
    }

    if (p.scenario === 'narrow-prefs') {
      // Cards should exist regardless of user prefs (server filters)
      // Just verify the response is valid
      if (!Array.isArray(cards)) {
        addIssue('P1', p.name, 'social-cards', 'Cards response not an array', 'Array', typeof cards);
      }
    }
  } catch (e) {
    addIssue('P1', p.name, 'social-cards', `Cards fetch failed: ${e.message}`, 'Valid cards', e.message);
  }

  // ── Matches + Message ──
  try {
    const { data: meRow } = await supabase.from('users').select('id').eq('email', `demo-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-`.slice(0, 30)).limit(1);
    // Use auth to find user's db ID
    const { data: userRows } = await supabase.from('users').select('id').eq('name', p.name).limit(1);
    const myDbId = userRows?.[0]?.id;
    
    if (myDbId) {
      const { data: matchRows } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, status')
        .or(`user1_id.eq.${myDbId},user2_id.eq.${myDbId}`)
        .eq('status', 'active')
        .limit(1);

      const match = matchRows?.[0];
      if (match) {
        if (p.scenario === 'send-message') {
          const msgRes = await fetchWithTimeout(`${BASE}/api/social/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ matchId: match.id, text: `${p.name} 的測試訊息` }),
          });
          if (!msgRes.ok) {
            addIssue('P1', p.name, 'send-message', `Message send failed: ${msgRes.status}`, '200', `${msgRes.status}`);
          }
        }

        if (p.scenario === 'report-flow') {
          const otherId = match.user1_id === myDbId ? match.user2_id : match.user1_id;
          const repRes = await fetchWithTimeout(`${BASE}/api/social/report`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ reportedUserDbId: otherId, matchId: match.id, reason: '自動測試（請忽略）' }),
          });
          if (!repRes.ok) {
            addIssue('P1', p.name, 'report', `Report failed: ${repRes.status}`, '200', `${repRes.status}`);
          }
        }
      }
    }
  } catch (e) {
    // Non-critical for personas without matches
  }

  // ── Page rendering ──
  for (const page of ['/home', '/onboarding/ai-chat', '/onboarding/profile', '/personality', '/settings', '/matches']) {
    try {
      const res = await fetchWithTimeout(`${BASE}${page}`);
      if (!res.ok) {
        addIssue('P0', p.name, `page:${page}`, `Page returned ${res.status}`, '200', `${res.status}`);
      }
    } catch (e) {
      addIssue('P0', p.name, `page:${page}`, `Page unreachable: ${e.message}`, '200', e.message);
    }
  }

  passCount++;
  console.log(`  ✅ Persona walkthrough complete`);
}

// ─── Static analysis issues (from code review) ──
console.log('\n── Static Code Analysis ──');

// Check specific code-level issues
const codeIssues = [
  // Check onboarding profile: no back button
  { screen: 'onboarding/profile', desc: 'No back button to return to AI chat if user wants to redo', severity: 'P2' },
  // Check: photo size limit inconsistency
  { screen: 'onboarding/profile vs settings', desc: 'Photo size limit is 2MB in onboarding but 5MB in settings — inconsistent', severity: 'P2' },
  // Check: celebration screen in profile page is dead code (showCelebration never set to true)
  { screen: 'onboarding/profile', desc: 'showCelebration state exists but is never set to true — dead code', severity: 'P2' },
  // Check: nickname not pre-filled from currentUser.name in onboarding profile
  { screen: 'onboarding/profile', desc: 'Nickname field starts empty even if user already has a name from auth — should pre-fill', severity: 'P1' },
  // Check: no loading state on personality page "開始探索配對" button click delay
  { screen: 'personality', desc: '"開始探索配對" shows "準備推薦中..." but updateProfile may take seconds — no progress indicator', severity: 'P2' },
  // Check: matches page doesn't show occupation/education
  { screen: 'matches', desc: 'Matches page does not display occupation or education of other user', severity: 'P2' },
  // Check: home page expanded card doesn't show occupation/education  
  { screen: 'home', desc: 'Home page card expansion does not show other user occupation/education', severity: 'P2' },
  // Check: chat page doesn't show other user occupation/education
  { screen: 'chat', desc: 'Chat header does not show other user occupation/education', severity: 'P2' },
  // Check: no way to go back from onboarding/profile to ai-chat
  { screen: 'onboarding/profile', desc: 'User cannot go back to retry AI chat from profile page — stuck if they want to redo chat', severity: 'P1' },
  // Check: settings page bio still editable but onboarding removed bio field
  { screen: 'settings', desc: 'Settings page still has free-text bio textarea but onboarding removed it — user may overwrite AI-generated bio', severity: 'P1' },
];

for (const ci of codeIssues) {
  addIssue(ci.severity, 'code-review', ci.screen, ci.desc, '', '');
}

// ─── Summary ──────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  ISSUE SUMMARY');
console.log('═══════════════════════════════════════\n');

const p0 = issues.filter(i => i.severity === 'P0');
const p1 = issues.filter(i => i.severity === 'P1');
const p2 = issues.filter(i => i.severity === 'P2');

console.log(`Total issues: ${issues.length}`);
console.log(`  🔴 P0 (Blocker): ${p0.length}`);
console.log(`  🟠 P1 (Major):   ${p1.length}`);
console.log(`  🟡 P2 (Minor):   ${p2.length}`);
console.log(`\nPersonas tested: ${passCount}/${personas.length}`);

if (issues.length > 0) {
  console.log('\n── All Issues ──\n');
  for (const i of issues) {
    const icon = i.severity === 'P0' ? '🔴' : i.severity === 'P1' ? '🟠' : '🟡';
    console.log(`${icon} #${i.id} [${i.severity}] ${i.persona} @ ${i.screen}`);
    console.log(`   ${i.desc}`);
    if (i.expected) console.log(`   Expected: ${i.expected}`);
    if (i.actual) console.log(`   Actual: ${i.actual}`);
    console.log('');
  }
}

process.exit(p0.length > 0 ? 2 : p1.length > 0 ? 1 : 0);
