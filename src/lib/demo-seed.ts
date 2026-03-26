import { createHash } from 'crypto';
import { createServerClient } from '@/lib/supabase-server';

export const DEMO_PASSWORD = 'MochiDemo123!';

const demoProfiles = [
  {
    email: 'demo-bot-amy@example.com',
    name: 'Amy',
    age: 24,
    gender: 'female',
    region: '台北市',
    bio: '喜歡散步、展覽和深夜聊天，偏好慢慢熟起來的關係。',
  },
  {
    email: 'demo-bot-ian@example.com',
    name: 'Ian',
    age: 27,
    gender: 'male',
    region: '新北市',
    bio: '白天寫程式，晚上研究咖啡店和電影配樂。',
  },
  {
    email: 'demo-bot-luna@example.com',
    name: 'Luna',
    age: 25,
    gender: 'female',
    region: '台中市',
    bio: '週末會去小旅行，也很愛交換生活裡的小怪癖。',
  },
  {
    email: 'demo-bot-mika@example.com',
    name: 'Mika',
    age: 26,
    gender: 'other',
    region: '高雄市',
    bio: '喜歡直覺型聊天，會記得你隨口說過的小事。',
  },
];

const demoAIPersonalities = [
  {
    bio: '喜歡散步、看展覽，偏好慢慢認識的關係。深夜聊天是我充電的方式。',
    traits: [
      { name: '好奇心強', score: 85, category: 'lifestyle' as const },
      { name: '重視深度連結', score: 90, category: 'emotional' as const },
      { name: '內向但溫暖', score: 75, category: 'social' as const },
    ],
    values: ['真誠', '自由', '深度連結'],
    communicationStyle: '喜歡文字溝通，表達細膩有溫度',
    relationshipGoal: '找到能慢慢聊開、彼此理解的人',
    chatSummary: '重視內在連結，偏好安靜但有深度的互動。',
    analyzedAt: new Date().toISOString(),
  },
  {
    bio: '白天寫程式，晚上研究咖啡店和電影配樂。理性外表下有一顆浪漫的心。',
    traits: [
      { name: '邏輯清晰', score: 90, category: 'lifestyle' as const },
      { name: '浪漫但低調', score: 70, category: 'emotional' as const },
      { name: '獨立自主', score: 85, category: 'values' as const },
    ],
    values: ['成長', '品味', '獨立'],
    communicationStyle: '先思考再開口，話不多但每句都有重點',
    relationshipGoal: '想找能互相欣賞、各自精彩的伴侶',
    chatSummary: '邏輯型思考者，注重個人空間但對感情認真。',
    analyzedAt: new Date().toISOString(),
  },
  {
    bio: '週末小旅行愛好者，會記得你隨口說的那句話。相信緣分也相信努力。',
    traits: [
      { name: '細心體貼', score: 90, category: 'emotional' as const },
      { name: '行動力強', score: 80, category: 'lifestyle' as const },
      { name: '樂觀正向', score: 85, category: 'social' as const },
    ],
    values: ['真誠', '陪伴', '成長'],
    communicationStyle: '溫暖直接，喜歡面對面聊天',
    relationshipGoal: '找一個能一起探索世界的旅伴',
    chatSummary: '溫暖的行動派，重視陪伴和共同成長。',
    analyzedAt: new Date().toISOString(),
  },
  {
    bio: '直覺型聊天達人，喜歡觀察生活中的小細節。最怕無聊，最愛有趣的靈魂。',
    traits: [
      { name: '直覺敏銳', score: 85, category: 'emotional' as const },
      { name: '創意豐富', score: 80, category: 'lifestyle' as const },
      { name: '重視感受', score: 90, category: 'values' as const },
    ],
    values: ['自由', '有趣', '感受'],
    communicationStyle: '感性直覺，聊天很有溫度',
    relationshipGoal: '想找聊天很舒服、懂得品味生活的人',
    chatSummary: '感性直覺型，重視對話品質和情緒連結。',
    analyzedAt: new Date().toISOString(),
  },
];

type AdminClient = ReturnType<typeof createServerClient>;

export function buildDemoEmail(name: string) {
  const normalized = name.trim().toLowerCase();
  const safeName = normalized.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12) || 'user';
  const hash = createHash('sha1').update(normalized).digest('hex').slice(0, 10);
  return `demo-${safeName}-${hash}@example.com`;
}

function buildAvatarDataUrl(name: string, background: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="#fff6ef" />
        </linearGradient>
      </defs>
      <rect width="640" height="800" fill="url(#g)" />
      <circle cx="320" cy="280" r="140" fill="rgba(255,255,255,0.55)" />
      <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="180" font-weight="700" fill="#5b4033">${name.slice(0, 1)}</text>
      <text x="50%" y="78%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="#7a5a4b">${name}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function deleteWhereIn(client: AdminClient, table: string, column: string, ids: string[]) {
  if (ids.length === 0) {
    return;
  }
  await client.from(table).delete().in(column, ids);
}

export function isEphemeralDemoEmail(email: string | null | undefined) {
  return /^demo-(?!bot-).+@example\.com$/i.test(email || '');
}

export async function ensureDemoProfiles(client: AdminClient) {
  const profileEmails = demoProfiles.map((profile) => profile.email);
  const seededIds: string[] = [];

  const { data: existingRows } = await client
    .from('users')
    .select('id, email')
    .in('email', profileEmails);

  const existingByEmail = new Map((existingRows || []).map((row) => [row.email as string, row.id as string]));

  for (const profile of demoProfiles) {
    let userId = existingByEmail.get(profile.email);
    if (!userId) {
      const { data: insertedRows, error: insertError } = await client
        .from('users')
        .insert({
          auth_id: null,
          email: profile.email,
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          bio: profile.bio,
          region: profile.region,
          ai_personality: demoAIPersonalities[demoProfiles.indexOf(profile) % demoAIPersonalities.length],
          preferences: {
            ageMin: 18,
            ageMax: 40,
            genderPreference: ['male', 'female', 'other'],
            region: profile.region,
            preferredRegions: [],
            hiddenMatchIds: [],
          },
          onboarding_complete: true,
          profile_visible: true,
          hide_age: false,
        })
        .select('id');

      if (insertError || !insertedRows?.[0]?.id) {
        continue;
      }

      userId = insertedRows[0].id as string;
      existingByEmail.set(profile.email, userId);
    }

    seededIds.push(userId);
  }

  if (seededIds.length > 0) {
    const { data: existingPhotos } = await client
      .from('user_photos')
      .select('user_id')
      .in('user_id', seededIds);

    const photoUserIds = new Set((existingPhotos || []).map((row) => row.user_id as string));
    const photoRows = demoProfiles
      .map((profile, index) => {
        const userId = existingByEmail.get(profile.email);
        if (!userId || photoUserIds.has(userId)) {
          return null;
        }

        return {
          user_id: userId,
          url: buildAvatarDataUrl(profile.name, ['#FFB088', '#86B6F6', '#F7C59F', '#B4E4C0'][index % 4]),
          sort_order: 0,
        };
      })
      .filter((row): row is { user_id: string; url: string; sort_order: number } => !!row);

    if (photoRows.length > 0) {
      await client.from('user_photos').insert(photoRows);
    }
  }

  return seededIds;
}

export async function resetDemoTestState(client: AdminClient) {
  const demoBotIds = await ensureDemoProfiles(client);
  const { data: demoRows } = await client
    .from('users')
    .select('id, auth_id, email')
    .like('email', 'demo-%@example.com');

  const ephemeralUsers = (demoRows || []).filter((row) => isEphemeralDemoEmail(row.email));
  const ephemeralDbIds = ephemeralUsers.map((row) => row.id as string).filter(Boolean);
  const ephemeralAuthIds = ephemeralUsers.map((row) => row.auth_id as string | null).filter((id): id is string => !!id);
  const interactionUserIds = [...new Set([...demoBotIds, ...ephemeralDbIds])];

  const [matchesByUser1, matchesByUser2] = await Promise.all([
    interactionUserIds.length > 0
      ? client.from('matches').select('id').in('user1_id', interactionUserIds)
      : Promise.resolve({ data: [] }),
    interactionUserIds.length > 0
      ? client.from('matches').select('id').in('user2_id', interactionUserIds)
      : Promise.resolve({ data: [] }),
  ]);

  const matchIds = [...new Set([
    ...((matchesByUser1.data || []).map((row) => row.id as string)),
    ...((matchesByUser2.data || []).map((row) => row.id as string)),
  ])];

  await Promise.all([
    deleteWhereIn(client, 'daily_cards', 'user_id', interactionUserIds),
    deleteWhereIn(client, 'daily_cards', 'target_user_id', interactionUserIds),
    deleteWhereIn(client, 'likes', 'from_user_id', interactionUserIds),
    deleteWhereIn(client, 'likes', 'to_user_id', interactionUserIds),
    deleteWhereIn(client, 'skipped_users', 'user_id', interactionUserIds),
    deleteWhereIn(client, 'skipped_users', 'skipped_user_id', interactionUserIds),
    deleteWhereIn(client, 'blocked_users', 'blocker_id', interactionUserIds),
    deleteWhereIn(client, 'blocked_users', 'blocked_id', interactionUserIds),
    deleteWhereIn(client, 'notifications', 'user_id', interactionUserIds),
    deleteWhereIn(client, 'reports', 'reporter_id', interactionUserIds),
    deleteWhereIn(client, 'reports', 'reported_user_id', interactionUserIds),
    deleteWhereIn(client, 'profile_views', 'viewer_id', interactionUserIds),
    deleteWhereIn(client, 'profile_views', 'viewed_user_id', interactionUserIds),
    deleteWhereIn(client, 'analytics_events', 'user_id', interactionUserIds),
    deleteWhereIn(client, 'messages', 'sender_id', interactionUserIds),
    deleteWhereIn(client, 'photo_consents', 'requester_id', interactionUserIds),
    deleteWhereIn(client, 'user_photos', 'user_id', ephemeralDbIds),
    deleteWhereIn(client, 'messages', 'match_id', matchIds),
    deleteWhereIn(client, 'photo_consents', 'match_id', matchIds),
    deleteWhereIn(client, 'reports', 'match_id', matchIds),
    deleteWhereIn(client, 'matches', 'id', matchIds),
    deleteWhereIn(client, 'user_photos', 'user_id', ephemeralDbIds),
  ]);

  return {
    demoBotCount: demoBotIds.length,
    deletedDemoUsers: ephemeralDbIds.length,
    deletedMatches: matchIds.length,
    reusedAuthUsers: ephemeralAuthIds.length,
  };
}