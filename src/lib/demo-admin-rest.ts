import { createHash } from 'crypto';

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
] as const;

const demoAIPersonality = {
  bio: '熱愛生活的小細節，相信每段對話都是一次新的發現。',
  traits: [
    { name: '好奇心強', score: 80, category: 'lifestyle' as const },
    { name: '溫暖友善', score: 85, category: 'social' as const },
    { name: '重視連結', score: 75, category: 'emotional' as const },
  ],
  values: ['真誠', '成長', '陪伴'],
  communicationStyle: '自然隨和，喜歡輕鬆的對話氛圍',
  relationshipGoal: '找到能好好說話、互相理解的人',
  chatSummary: '個性溫和，重視真誠和日常陪伴。',
  analyzedAt: new Date().toISOString(),
};

const DEMO_BOT_EMAILS = new Set(demoProfiles.map((profile) => profile.email.toLowerCase()));
const ID_BATCH_SIZE = 50;

type DemoProfileRow = { id: string; auth_id?: string | null; email?: string | null; name?: string | null };

type AuthAdminCreateUserResponse = { id: string };
type AuthPasswordSignInResponse = { user?: { id?: string } | null };

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration');
  }
  return { url, serviceKey };
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

function adminHeaders(extra: Record<string, string> = {}) {
  const { serviceKey } = getConfig();
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function restRequest<T>(path: string, init?: RequestInit, allowEmpty = false): Promise<T> {
  const { url } = getConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...adminHeaders(),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `${response.status} ${response.statusText}`);
  }
  if (!text) {
    return (allowEmpty ? null : []) as T;
  }
  return JSON.parse(text) as T;
}

async function authAdminCreateUser(email: string, password: string, displayName: string) {
  const { url } = getConfig();
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    }),
    cache: 'no-store',
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `${response.status} ${response.statusText}`);
  }
  return JSON.parse(text) as AuthAdminCreateUserResponse;
}

async function authPasswordSignIn(email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing public Supabase configuration');
  }

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) as AuthPasswordSignInResponse : null;
}

function encodeEq(value: string) {
  return encodeURIComponent(value);
}

function inFilter(column: string, ids: string[]) {
  return `${column}=in.(${ids.join(',')})`;
}

function chunkIds(ids: string[], size = ID_BATCH_SIZE) {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

async function getUserByEmail(email: string) {
  const rows = await restRequest<DemoProfileRow[]>(`users?select=id,auth_id,email,name&email=eq.${encodeEq(email)}&limit=1`);
  return rows[0] || null;
}

async function insertUser(payload: Record<string, unknown>) {
  const rows = await restRequest<DemoProfileRow[]>('users', {
    method: 'POST',
    headers: adminHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  });
  return rows[0] || null;
}

async function upsertUsers(payload: Record<string, unknown> | Record<string, unknown>[]) {
  return restRequest<DemoProfileRow[]>(`users?on_conflict=auth_id`, {
    method: 'POST',
    headers: adminHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(payload),
  });
}

async function upsertLikes(payload: Record<string, unknown>[]) {
  if (payload.length === 0) return [];
  return restRequest<Record<string, unknown>[]>(`likes?on_conflict=from_user_id,to_user_id`, {
    method: 'POST',
    headers: adminHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(payload),
  });
}

async function insertRows(table: string, payload: Record<string, unknown> | Record<string, unknown>[]) {
  return restRequest<Record<string, unknown>[]>(table, {
    method: 'POST',
    headers: adminHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  });
}

async function selectRows<T>(path: string) {
  return restRequest<T[]>(path);
}

async function selectRowsByIds<T>(table: string, selectClause: string, column: string, ids: string[]) {
  if (ids.length === 0) return [] as T[];

  const rows: T[] = [];
  for (const chunk of chunkIds([...new Set(ids.filter(Boolean))])) {
    const batch = await selectRows<T>(`${table}?select=${selectClause}&${inFilter(column, chunk)}`);
    rows.push(...batch);
  }
  return rows;
}

async function deleteRows(table: string, query: string) {
  await restRequest<null>(`${table}?${query}`, {
    method: 'DELETE',
    headers: adminHeaders({ Prefer: 'return=minimal' }),
  }, true);
}

async function deleteRowsByIds(table: string, column: string, ids: string[]) {
  for (const chunk of chunkIds([...new Set(ids.filter(Boolean))])) {
    await deleteRows(table, inFilter(column, chunk));
  }
}

export function buildDemoEmail(name: string) {
  const normalized = name.trim().toLowerCase();
  const safeName = normalized.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12) || 'user';
  const hash = createHash('sha1').update(normalized).digest('hex').slice(0, 10);
  return `demo-${safeName}-${hash}@example.com`;
}

export function isEphemeralDemoEmail(email: string | null | undefined) {
  return /^demo-(?!bot-).+@example\.com$/i.test(email || '');
}

export async function ensureDemoProfiles() {
  const seededIds: string[] = [];

  for (const [index, profile] of demoProfiles.entries()) {
    let row = await getUserByEmail(profile.email);
    if (!row?.id) {
      row = await insertUser({
        auth_id: null,
        email: profile.email,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        bio: profile.bio,
        region: profile.region,
        ai_personality: demoAIPersonality,
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
      });
    }

    if (!row?.id) {
      continue;
    }

    seededIds.push(row.id);
    const existingPhoto = await selectRows<{ id: string }>(`user_photos?select=id&user_id=eq.${row.id}&limit=1`);
    if (existingPhoto.length === 0) {
      await insertRows('user_photos', {
        user_id: row.id,
        url: buildAvatarDataUrl(profile.name, ['#FFB088', '#86B6F6', '#F7C59F', '#B4E4C0'][index % 4]),
        sort_order: 0,
      });
    }
  }

  return seededIds;
}

export async function resetDemoTestState() {
  const demoRows = await selectRows<DemoProfileRow>('users?select=id,auth_id,email&email=like.demo-%25%40example.com');
  const demoBotDbIds = demoRows
    .filter((row) => DEMO_BOT_EMAILS.has((row.email || '').toLowerCase()))
    .map((row) => row.id)
    .filter(Boolean);
  const ephemeralUsers = demoRows.filter((row) => isEphemeralDemoEmail(row.email));
  const ephemeralDbIds = ephemeralUsers.map((row) => row.id).filter(Boolean);
  const ephemeralAuthIds = ephemeralUsers.map((row) => row.auth_id).filter((id): id is string => !!id);
  const interactionUserIds = [...new Set([...demoBotDbIds, ...ephemeralDbIds])];

  const matchesByUser1 = await selectRowsByIds<{ id: string }>('matches', 'id', 'user1_id', interactionUserIds);
  const matchesByUser2 = await selectRowsByIds<{ id: string }>('matches', 'id', 'user2_id', interactionUserIds);
  const matchIds = [...new Set([...matchesByUser1.map((row) => row.id), ...matchesByUser2.map((row) => row.id)])];
  const removableUserIds = [...new Set([...demoBotDbIds, ...ephemeralDbIds])];

  await Promise.all([
    deleteRowsByIds('daily_cards', 'user_id', interactionUserIds),
    deleteRowsByIds('daily_cards', 'target_user_id', interactionUserIds),
    deleteRowsByIds('likes', 'from_user_id', interactionUserIds),
    deleteRowsByIds('likes', 'to_user_id', interactionUserIds),
    deleteRowsByIds('skipped_users', 'user_id', interactionUserIds),
    deleteRowsByIds('skipped_users', 'skipped_user_id', interactionUserIds),
    deleteRowsByIds('blocked_users', 'blocker_id', interactionUserIds),
    deleteRowsByIds('blocked_users', 'blocked_id', interactionUserIds),
    deleteRowsByIds('notifications', 'user_id', interactionUserIds),
    deleteRowsByIds('reports', 'reporter_id', interactionUserIds),
    deleteRowsByIds('reports', 'reported_user_id', interactionUserIds),
    deleteRowsByIds('profile_views', 'viewer_id', interactionUserIds),
    deleteRowsByIds('profile_views', 'viewed_user_id', interactionUserIds),
    deleteRowsByIds('analytics_events', 'user_id', interactionUserIds),
    deleteRowsByIds('messages', 'sender_id', interactionUserIds),
    deleteRowsByIds('photo_consents', 'requester_id', interactionUserIds),
    deleteRowsByIds('user_photos', 'user_id', removableUserIds),
    deleteRowsByIds('messages', 'match_id', matchIds),
    deleteRowsByIds('photo_consents', 'match_id', matchIds),
    deleteRowsByIds('reports', 'match_id', matchIds),
    deleteRowsByIds('matches', 'id', matchIds),
  ]);

  await deleteRowsByIds('users', 'id', removableUserIds);
  const demoBotIds = await ensureDemoProfiles();

  return {
    demoBotCount: demoBotIds.length,
    deletedDemoBotRows: demoBotDbIds.length,
    deletedDemoUsers: ephemeralDbIds.length,
    deletedMatches: matchIds.length,
    reusedAuthUsers: ephemeralAuthIds.length,
  };
}

export async function ensureDemoLogin(rawName: string) {
  const seededProfileIds = await ensureDemoProfiles();
  const email = buildDemoEmail(rawName);

  let existingProfile = await getUserByEmail(email);
  let authUserId = existingProfile?.auth_id || null;
  if (!authUserId) {
    try {
      const createdUser = await authAdminCreateUser(email, DEMO_PASSWORD, rawName);
      authUserId = createdUser.id;
    } catch (error) {
      const existingAuthSession = await authPasswordSignIn(email, DEMO_PASSWORD);
      authUserId = existingAuthSession?.user?.id || null;
      if (!authUserId) {
        throw error;
      }
    }
  }

  const profileRows = await upsertUsers({
    auth_id: authUserId,
    email,
    name: rawName,
    age: 25,
    gender: 'other',
    bio: '',
    region: '台北市',
    ai_personality: null,
    preferences: {
      ageMin: 20,
      ageMax: 35,
      genderPreference: ['male', 'female', 'other'],
      region: '台北市',
      preferredRegions: [],
      hiddenMatchIds: [],
    },
    onboarding_complete: false,
    profile_visible: true,
    hide_age: false,
  });

  const currentUserDbId = profileRows?.[0]?.id;
  if (currentUserDbId && seededProfileIds.length > 0) {
    await upsertLikes(
      seededProfileIds.map((seedId, index) => ({
        from_user_id: seedId,
        to_user_id: currentUserDbId,
        topic_answer: [
          '我也喜歡慢慢聊開。',
          '如果你也喜歡咖啡店，我們應該會很合。',
          '我會被真誠的小細節打動。',
          '我很吃直覺和節奏感，有共鳴就會想多聊。',
        ][index % 4],
      }))
    );

    const primaryMatchPartnerId = seededProfileIds[0];
    if (primaryMatchPartnerId) {
      const [user1Id, user2Id] = [currentUserDbId, primaryMatchPartnerId].sort();
      const existingMatch = await selectRows<{ id: string }>(`matches?select=id&user1_id=eq.${user1Id}&user2_id=eq.${user2Id}&limit=1`);

      if (existingMatch.length === 0) {
        const partnerRows = await selectRows<{ name: string }>(`users?select=name&id=eq.${primaryMatchPartnerId}&limit=1`);
        const insertedMatch = await insertRows('matches', {
          user1_id: user1Id,
          user2_id: user2Id,
          topic_id: 'demo-intro-topic',
          topic_text: '第一次見面時，你通常會怎麼開場？',
          topic_category: '破冰',
          topic_answers: {
            [currentUserDbId]: '我通常會先從最近的生活小事聊起。',
            [primaryMatchPartnerId]: '我喜歡從今天的心情或最近的興趣開始。',
          },
          compatibility: 82,
          status: 'active',
        });

        const insertedMatchId = insertedMatch?.[0]?.id as string | undefined;
        if (insertedMatchId) {
          await insertRows('notifications', [
            {
              user_id: currentUserDbId,
              type: 'match',
              title: '配對成功',
              body: `你和 ${partnerRows[0]?.name || 'Amy'} 已成功配對`,
              link: `/chat/${insertedMatchId}`,
              read: false,
            },
            {
              user_id: primaryMatchPartnerId,
              type: 'match',
              title: '配對成功',
              body: `${rawName} 已和你成功配對`,
              link: `/chat/${insertedMatchId}`,
              read: false,
            },
          ]);
        }
      }
    }
  }

  return { email, password: DEMO_PASSWORD };
}
