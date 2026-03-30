// ============================
// Mochi 默契 - Type Definitions
// ============================

// 配對算法用評分維度
export interface ScoringFeatures {
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'mixed';
  socialEnergy: number;         // 0-100
  conflictStyle: 'confronter' | 'avoider' | 'collaborator' | 'compromiser';
  loveLanguage: string;
  lifePace: 'slow' | 'moderate' | 'fast';
  emotionalDepth: number;       // 0-100
}

// AI 對話分析產生的人格向量
export interface AIPersonality {
  bio: string;                  // AI 生成的自我介紹
  traits: PersonalityTrait[];   // 人格特質標籤
  values: string[];             // 核心價值觀 (e.g. '真誠', '自由', '成長')
  communicationStyle: string;   // 溝通風格描述
  relationshipGoal: string;     // 關係期待描述
  chatSummary: string;          // AI 對話摘要（內部用，不公開）
  analyzedAt: string;           // ISO date
  datingStyle?: string;         // 交往風格
  redFlags?: string[];          // 地雷/在意的事
  tags?: string[];              // 快速標籤
  scoringFeatures?: ScoringFeatures; // 配對算法評分維度
}

export interface PersonalityTrait {
  name: string;     // e.g. '好奇心強', '重視安全感'
  score: number;    // 0-100 強度
  category: 'social' | 'emotional' | 'lifestyle' | 'values';
}

export interface UserProfile {
  id: string;
  dbId?: string;
  name: string;
  occupation?: string;
  education?: string;
  age: number;
  hideAge?: boolean;
  profileVisible?: boolean;
  gender: 'male' | 'female' | 'other';
  bio: string;
  photos: string[];
  aiPersonality?: AIPersonality;
  preferences: {
    ageMin: number;
    ageMax: number;
    genderPreference: ('male' | 'female' | 'other')[];
    region: string;
    preferredRegions?: string[];  // multi-select: cities user wants to match with
    hiddenMatchIds?: string[];
    notificationPrefs?: Record<string, boolean>; // notification toggle states
  };
  onboardingComplete: boolean;
  createdAt: string;
}

export interface DailyCard {
  user: UserProfile;
  compatibility: number;
  topic: ConversationTopic;
  expiresAt: string; // ISO date
  liked: boolean;
  skipped?: boolean;
  topicAnswer?: string;
  matchReasons?: string[];
  matchCaution?: string | null;
  matchedSignals?: string[];
  cautionSignals?: string[];
}

export interface ConversationTopic {
  id: string;
  text: string;
  category: string;
}

export interface Match {
  id: string;
  users: [string, string]; // user IDs
  topic: ConversationTopic;
  topicAnswers: Record<string, string>; // userId -> answer
  messages: ChatMessage[];
  createdAt: string;
  status: 'active' | 'expired' | 'removed';
  otherUser?: UserProfile;
  compatibility?: number;
  matchReasons?: string[];
  matchCaution?: string | null;
  matchedSignals?: string[];
  cautionSignals?: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  type: 'text' | 'image';
  text: string;
  imageUrl?: string;
  timestamp: string;
  readAt?: string | null;
}

export interface LikeAction {
  id?: string;
  fromUserId: string;
  toUserId: string;
  topicAnswer: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  type: 'match' | 'message' | 'like' | 'weekly' | 'system' | 'profile_view';
  title: string;
  body: string;
  read: boolean;
  timestamp: string;
  link?: string;
}

// 台灣所有縣市（22 個）
export const TAIWAN_CITIES = [
  '台北市', '新北市', '基隆市', '桃園市',
  '新竹市', '新竹縣', '苗栗縣',
  '台中市', '彰化縣', '南投縣',
  '雲林縣', '嘉義市', '嘉義縣',
  '台南市', '高雄市', '屏東縣',
  '宜蘭縣', '花蓮縣', '台東縣',
  '澎湖縣', '金門縣', '連江縣',
] as const;
