// ============================
// Mochi 默契 - Type Definitions
// ============================

// AI 對話分析產生的人格向量
export interface AIPersonality {
  bio: string;                  // AI 整理的人格摘要，正式公開自介在 profile 完成後生成
  // --- Personality Profile ---
  traits: PersonalityTrait[];   // 人格特質標籤
  values: string[];             // 核心價值觀 (e.g. '真誠', '自由', '成長')
  // --- Dating Style ---
  datingStyle?: string;          // 交往風格描述 (e.g. '慢熱穩定型', '熱情主動型')
  // --- Communication ---
  communicationStyle: string;   // 溝通風格描述
  // --- Relationship ---
  relationshipGoal: string;     // 關係期待描述
  // --- Red Flags ---
  redFlags?: string[];           // 用戶明確表達的地雷 (e.g. '不回訊息', '情緒勒索')
  // --- Tags & Features ---
  tags?: string[];               // 快速識別標籤 (e.g. '#慢熱', '#重視獨處', '#戶外派')
  scoringFeatures?: ScoringFeatures; // 結構化評分特徵
  // --- Internal ---
  chatSummary: string;          // AI 對話摘要（內部用，不公開）
  analyzedAt: string;           // ISO date
}

export interface ScoringFeatures {
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'mixed';  // 依附風格
  socialEnergy: number;         // 社交能量 0-100 (0=極度內向, 100=極度外向)
  conflictStyle: 'confronter' | 'avoider' | 'collaborator' | 'compromiser';  // 衝突處理
  loveLanguage: string;         // 主要愛的語言
  lifePace: 'slow' | 'moderate' | 'fast';  // 生活節奏
  emotionalDepth: number;       // 情感深度 0-100
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
  age: number;
  hideAge?: boolean;
  profileVisible?: boolean;
  gender: 'male' | 'female' | 'other';
  bio: string;
  occupation?: string;
  interests?: string[];
  heightCm?: number;
  weightKg?: number;
  education?: string;
  pets?: string[];
  photos: string[];
  aiPersonality?: AIPersonality;
  preferences: {
    ageMin: number;
    ageMax: number;
    genderPreference: ('male' | 'female' | 'other')[];
    region: string;
    preferredRegions?: string[];  // multi-select: cities user wants to match with
    hiddenMatchIds?: string[];
    notificationPrefs?: {
      matches: boolean;
      messages: boolean;
      likes: boolean;
      weekly: boolean;
      system: boolean;
    };
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
  recommendationReasons?: { reasons: string[]; caution: string | null } | null;
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
