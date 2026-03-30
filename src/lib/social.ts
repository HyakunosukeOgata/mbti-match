import { conversationTopics } from './mock-data';
import { parseStoredMessage } from './chat-message';
import { DailyCard, Match, ChatMessage, LikeAction, UserProfile, ConversationTopic, AppNotification, AIPersonality } from './types';

type JsonObject = Record<string, unknown>;

export interface DbUserRow {
  id: string;
  auth_id: string | null;
  email?: string | null;
  name: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  bio: string | null;
  region: string | null;
  ai_personality: JsonObject | null;
  preferences: JsonObject | null;
  onboarding_complete: boolean | null;
  created_at: string;
  profile_visible?: boolean | null;
  hide_age?: boolean | null;
}

export interface DbUserPhotoRow {
  user_id: string;
  url: string;
  sort_order: number;
}

export interface DbLikeRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  topic_answer: string | null;
  created_at: string;
}

export interface DbMessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
}

export interface DbMatchRow {
  id: string;
  user1_id: string;
  user2_id: string;
  topic_id: string | null;
  topic_text: string | null;
  topic_category: string | null;
  topic_answers: Record<string, string> | null;
  compatibility: number | null;
  matched_signals?: string[] | null;
  caution_signals?: string[] | null;
  recommendation_reasons?: JsonObject | null;
  status: 'active' | 'expired' | 'removed';
  created_at: string;
}

export interface DbDailyCardRow {
  id: string;
  user_id: string;
  target_user_id: string;
  compatibility: number;
  topic_id: string | null;
  topic_text: string | null;
  topic_category?: string | null;
  expires_at: string;
  liked: boolean | null;
  skipped: boolean | null;
  matched_signals?: string[] | null;
  caution_signals?: string[] | null;
  recommendation_reasons?: JsonObject | null;
  card_date: string;
  created_at: string;
}

function parseRecommendationPayload(value: JsonObject | null | undefined) {
  if (!value || typeof value !== 'object') {
    return { reasons: undefined, caution: null as string | null };
  }

  const reasons = Array.isArray(value.reasons)
    ? value.reasons.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : undefined;
  const caution = typeof value.caution === 'string' && value.caution.trim().length > 0
    ? value.caution
    : null;

  return { reasons, caution };
}

export interface DbNotificationRow {
  id: string;
  type: AppNotification['type'];
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function mapDbUserToProfile(row: DbUserRow, photos: string[] = []): UserProfile {
  const preferences = (row.preferences || {}) as JsonObject;
  const occupation = typeof preferences.occupation === 'string' ? preferences.occupation : '';
  const education = typeof preferences.education === 'string' ? preferences.education : '';

  return {
    id: row.auth_id || row.id,
    dbId: row.id,
    name: row.name || '',
    occupation,
    education,
    age: row.age || 25,
    hideAge: row.hide_age ?? false,
    profileVisible: row.profile_visible ?? true,
    gender: row.gender || 'other',
    bio: row.bio || '',
    photos,
    aiPersonality: row.ai_personality ? row.ai_personality as unknown as AIPersonality : undefined,
    preferences: {
      ageMin: typeof preferences.ageMin === 'number' ? preferences.ageMin : 20,
      ageMax: typeof preferences.ageMax === 'number' ? preferences.ageMax : 35,
      genderPreference: Array.isArray(preferences.genderPreference)
        ? preferences.genderPreference as UserProfile['preferences']['genderPreference']
        : ['female', 'male', 'other'],
      region: row.region || '台北市',
      preferredRegions: Array.isArray(preferences.preferredRegions)
        ? preferences.preferredRegions as string[]
        : undefined,
      hiddenMatchIds: Array.isArray(preferences.hiddenMatchIds)
        ? preferences.hiddenMatchIds as string[]
        : undefined,
    },
    onboardingComplete: row.onboarding_complete ?? false,
    createdAt: row.created_at,
  };
}

export function mapNotificationRow(row: DbNotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    read: row.read,
    timestamp: row.created_at,
    link: row.link || undefined,
  };
}

export async function loadProfilesByDbIds(
  client: { from: (table: string) => any },
  dbIds: string[]
): Promise<Map<string, UserProfile>> {
  const uniqueIds = [...new Set(dbIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const photosByUserId = new Map<string, string[]>();
  const profileRows: DbUserRow[] = [];
  const chunkSize = 100;

  for (let index = 0; index < uniqueIds.length; index += chunkSize) {
    const chunk = uniqueIds.slice(index, index + chunkSize);
    const [{ data: userRows, error: userError }, { data: photoRows, error: photoError }] = await Promise.all([
      client.from('users').select('*').in('id', chunk),
      client.from('user_photos').select('user_id, url, sort_order').in('user_id', chunk).order('sort_order', { ascending: true }),
    ]);

    if (userError) throw userError;
    if (photoError) throw photoError;

    profileRows.push(...((userRows || []) as DbUserRow[]));

    for (const photo of (photoRows || []) as DbUserPhotoRow[]) {
      const current = photosByUserId.get(photo.user_id) || [];
      current.push(photo.url);
      photosByUserId.set(photo.user_id, current);
    }
  }

  const profiles = new Map<string, UserProfile>();
  for (const row of profileRows) {
    profiles.set(row.id, mapDbUserToProfile(row, photosByUserId.get(row.id) || []));
  }
  return profiles;
}

export function pickRandomTopics(count: number): ConversationTopic[] {
  const shuffled = [...conversationTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function mapDailyCardRow(row: DbDailyCardRow, targetUser: UserProfile): DailyCard {
  const recommendation = parseRecommendationPayload(row.recommendation_reasons);

  return {
    user: targetUser,
    compatibility: row.compatibility,
    topic: {
      id: row.topic_id || 'daily-topic',
      text: row.topic_text || '聊聊最近讓你開心的一件事',
      category: row.topic_category || '破冰',
    },
    expiresAt: row.expires_at,
    liked: row.liked ?? false,
    skipped: row.skipped ?? false,
    matchReasons: recommendation.reasons,
    matchCaution: recommendation.caution,
    matchedSignals: row.matched_signals || undefined,
    cautionSignals: row.caution_signals || undefined,
  } as DailyCard;
}

export function mapLikeRow(row: DbLikeRow, currentUserAuthId: string, profilesByDbId: Map<string, UserProfile>): LikeAction | null {
  const fromProfile = profilesByDbId.get(row.from_user_id);
  const toProfile = profilesByDbId.get(row.to_user_id);
  if (!fromProfile || !toProfile) return null;

  return {
    id: row.id,
    fromUserId: row.from_user_id === fromProfile.dbId ? fromProfile.id : currentUserAuthId,
    toUserId: row.to_user_id === toProfile.dbId ? toProfile.id : toProfile.id,
    topicAnswer: row.topic_answer || '',
    timestamp: row.created_at,
  };
}

export function mapMessageRow(row: DbMessageRow, profilesByDbId: Map<string, UserProfile>, fallbackAuthUserId: string): ChatMessage {
  const sender = profilesByDbId.get(row.sender_id);
  const parsed = parseStoredMessage(row.text);
  return {
    id: row.id,
    senderId: sender?.id || fallbackAuthUserId,
    type: parsed.type,
    text: parsed.text,
    imageUrl: parsed.imageUrl,
    timestamp: row.created_at,
    readAt: row.read_at,
  };
}

export function mapMatchRow(
  row: DbMatchRow,
  currentUserDbId: string,
  currentUserAuthId: string,
  profilesByDbId: Map<string, UserProfile>,
  messages: DbMessageRow[]
): Match | null {
  const user1 = profilesByDbId.get(row.user1_id);
  const user2 = profilesByDbId.get(row.user2_id);
  if (!user1 || !user2) return null;

  const otherUser = row.user1_id === currentUserDbId ? user2 : user1;
  const mappedTopicAnswers = Object.fromEntries(
    Object.entries(row.topic_answers || {}).map(([key, value]) => {
      const profile = [...profilesByDbId.values()].find((candidate) => candidate.dbId === key || candidate.id === key);
      return [profile?.id || key, value];
    })
  );
  const recommendation = parseRecommendationPayload(row.recommendation_reasons);

  return {
    id: row.id,
    users: [user1.id, user2.id],
    topic: {
      id: row.topic_id || 'daily-topic',
      text: row.topic_text || '聊聊最近讓你開心的一件事',
      category: row.topic_category || '破冰',
    },
    topicAnswers: mappedTopicAnswers,
    messages: messages.map((message) => mapMessageRow(message, profilesByDbId, currentUserAuthId)),
    createdAt: row.created_at,
    status: row.status,
    otherUser,
    compatibility: row.compatibility ?? undefined,
    matchReasons: recommendation.reasons,
    matchCaution: recommendation.caution,
    matchedSignals: row.matched_signals || undefined,
    cautionSignals: row.caution_signals || undefined,
  } as Match;
}