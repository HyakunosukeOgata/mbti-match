// ============================
// MBTI Match - Type Definitions
// ============================

export type MBTIDimension = 'EI' | 'SN' | 'TF' | 'JP';
export type MBTIStrength = 50 | 75 | 100;

export interface MBTIProfile {
  EI: { type: 'E' | 'I'; strength: MBTIStrength };
  SN: { type: 'S' | 'N'; strength: MBTIStrength };
  TF: { type: 'T' | 'F'; strength: MBTIStrength };
  JP: { type: 'J' | 'P'; strength: MBTIStrength };
}

export interface ScenarioQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
  week: number; // 第幾週的題目
}

export interface ScenarioAnswer {
  questionId: string;
  myAnswer: number[];        // 複選：選項 index 陣列
  partnerAnswer: number[];   // 複選：希望對方的選項 index 陣列
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bio: string;
  photos: string[];
  mbti: MBTIProfile;
  mbtiCode: string; // e.g. "ENFP"
  scenarioAnswers: ScenarioAnswer[];
  preferences: {
    ageMin: number;
    ageMax: number;
    genderPreference: ('male' | 'female' | 'other')[];
    region: string;
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
  topicAnswer?: string;
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
  status: 'active' | 'expired';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface LikeAction {
  fromUserId: string;
  toUserId: string;
  topicAnswer: string;
  timestamp: string;
}
