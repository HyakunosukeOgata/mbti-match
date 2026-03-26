import { ConversationTopic, UserProfile, AIPersonality } from './types';

// ============================
// Mock AI Personalities（假資料用）
// ============================
const mockAIPersonalities: AIPersonality[] = [
  { bio: '喜歡攝影和旅行，用文字記錄生活的浪漫靈魂。', traits: [{ name: '浪漫敏感', score: 90, category: 'emotional' }, { name: '獨立思考', score: 80, category: 'values' }], values: ['真誠', '自由', '美感'], communicationStyle: '溫柔文字派', relationshipGoal: '找到能一起看日落的人', chatSummary: '浪漫型', analyzedAt: '2026-01-15' },
  { bio: '工程師兼業餘廚師，喜歡有效率的溝通。', traits: [{ name: '邏輯清晰', score: 95, category: 'lifestyle' }, { name: '目標導向', score: 90, category: 'values' }], values: ['效率', '成長', '可靠'], communicationStyle: '直接有力', relationshipGoal: '找一起生活的夥伴', chatSummary: '行動派', analyzedAt: '2026-01-20' },
  { bio: '插畫家，到哪裡都是開心果！最近迷上烘焙。', traits: [{ name: '熱情開朗', score: 95, category: 'social' }, { name: '創意豐富', score: 85, category: 'lifestyle' }], values: ['有趣', '自由', '分享'], communicationStyle: '活潑自然', relationshipGoal: '找能一起探索新事物的人', chatSummary: '探索型', analyzedAt: '2026-02-01' },
  { bio: '自由工作者，喜歡安靜做自己的事。養了一隻貓叫小橘。', traits: [{ name: '獨立自主', score: 90, category: 'values' }, { name: '觀察力強', score: 80, category: 'emotional' }], values: ['自由', '品味', '獨立'], communicationStyle: '話不多但有深度', relationshipGoal: '找能深度聊天的人', chatSummary: '獨立型', analyzedAt: '2026-02-05' },
  { bio: '護理師，天生的照顧者。喜歡做甜點分享給大家。', traits: [{ name: '溫暖體貼', score: 95, category: 'emotional' }, { name: '責任感強', score: 90, category: 'values' }], values: ['陪伴', '真誠', '照顧'], communicationStyle: '溫暖直接', relationshipGoal: '找能一起分擔生活的人', chatSummary: '照顧型', analyzedAt: '2026-02-10' },
  { bio: '行銷主管，腦子裡永遠有各種點子。假日喜歡衝浪。', traits: [{ name: '創意爆發', score: 90, category: 'lifestyle' }, { name: '辯論高手', score: 85, category: 'social' }], values: ['突破', '有趣', '挑戰'], communicationStyle: '機智幽默', relationshipGoal: '找有想法能互相刺激的人', chatSummary: '辯論型', analyzedAt: '2026-02-12' },
  { bio: '研究生，外冷內熱型。對喜歡的人超級用心。', traits: [{ name: '深度思考', score: 95, category: 'lifestyle' }, { name: '專注認真', score: 90, category: 'values' }], values: ['深度', '成長', '品質'], communicationStyle: '精準有條理', relationshipGoal: '找能互相欣賞、各自精彩的人', chatSummary: '策略型', analyzedAt: '2026-02-15' },
  { bio: '健身教練，活在當下的行動派！正能量滿滿。', traits: [{ name: '活力充沛', score: 95, category: 'social' }, { name: '樂觀正向', score: 90, category: 'emotional' }], values: ['行動', '健康', '快樂'], communicationStyle: '熱情直接', relationshipGoal: '找一起冒險的人', chatSummary: '表演型', analyzedAt: '2026-02-18' },
  { bio: 'UI 設計師，安靜的美感追求者。最愛文青風格的生活。', traits: [{ name: '美感敏銳', score: 90, category: 'lifestyle' }, { name: '內斂溫柔', score: 85, category: 'emotional' }], values: ['美感', '品味', '寧靜'], communicationStyle: '細膩有溫度', relationshipGoal: '找懂得品味生活的人', chatSummary: '美感型', analyzedAt: '2026-02-20' },
  { bio: '律師，認真負責。喜歡閱讀推理小說和下棋。', traits: [{ name: '嚴謹負責', score: 95, category: 'values' }, { name: '邏輯分析', score: 90, category: 'lifestyle' }], values: ['可靠', '公正', '深度'], communicationStyle: '條理分明', relationshipGoal: '找認真看待感情的人', chatSummary: '守護型', analyzedAt: '2026-02-22' },
];

// ============================
// 話題庫（配對卡片的破冰話題）
// ============================
export const conversationTopics: ConversationTopic[] = [
  { id: 't1', text: '如果明天放假一天，你會去哪裡？', category: '輕鬆' },
  { id: 't2', text: '最近看的一部影劇或動漫是什麼？推薦嗎？', category: '興趣' },
  { id: 't3', text: '你是早起的鳥還是夜貓子？', category: '生活' },
  { id: 't4', text: '如果可以瞬間學會一個技能，你想學什麼？', category: '想像' },
  { id: 't5', text: '最近讓你感到開心的一件小事是什麼？', category: '心情' },
  { id: 't6', text: '你比較喜歡山還是海？為什麼？', category: '偏好' },
  { id: 't7', text: '旅行你喜歡規劃好一切還是隨意走？', category: '旅行' },
  { id: 't8', text: '深夜最想吃的食物是什麼？', category: '美食' },
  { id: 't9', text: '你最近的手機桌布是什麼？', category: '日常' },
  { id: 't10', text: '如果可以和任何人吃一頓飯，你想約誰？', category: '想像' },
  { id: 't11', text: '你覺得曖昧期是享受的還是煎熬的？', category: '感情' },
  { id: 't12', text: '你最近新嘗試的一件事是什麼？', category: '成長' },
  { id: 't13', text: '你最珍惜的一段友情是怎麼開始的？', category: '回憶' },
  { id: 't14', text: '如果你是一種動物，你覺得你會是什麼？', category: '趣味' },
  { id: 't15', text: '你理想的週日早晨是什麼樣子？', category: '生活' },
];

// ============================
// Mock 用戶資料（假資料）
// ============================
const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

function generateAvatar(name: string, colorIndex: number, variant: number = 0): string {
  // 用 data URI 生成簡單的 SVG 頭像，variant 可產生不同風格
  const color = avatarColors[colorIndex % avatarColors.length];
  const initial = name.charAt(0);
  if (variant === 1) {
    // 漸層背景 + 圓形裝飾
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="#fff" stop-opacity=".3"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><circle cx="160" cy="40" r="30" fill="white" opacity=".15"/><text x="100" y="125" text-anchor="middle" font-size="70" font-family="Arial" fill="white">${initial}</text><text x="100" y="170" text-anchor="middle" font-size="20" font-family="Arial" fill="white" opacity=".6">📷 2</text></svg>`)}`;
  }
  if (variant === 2) {
    // 深色背景 + 星星裝飾
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${color}" opacity=".7"/><rect width="200" height="200" fill="#000" opacity=".2"/><circle cx="30" cy="30" r="4" fill="white" opacity=".5"/><circle cx="170" cy="50" r="3" fill="white" opacity=".4"/><circle cx="50" cy="170" r="5" fill="white" opacity=".3"/><text x="100" y="125" text-anchor="middle" font-size="70" font-family="Arial" fill="white">${initial}</text><text x="100" y="170" text-anchor="middle" font-size="20" font-family="Arial" fill="white" opacity=".6">📷 3</text></svg>`)}`;
  }
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${color}"/><text x="100" y="120" text-anchor="middle" font-size="80" font-family="Arial" fill="white">${initial}</text></svg>`)}`;
}

export const mockUsers: UserProfile[] = [
  {
    id: 'user-1',
    name: '小雨',
    age: 25,
    gender: 'female',
    bio: '喜歡攝影和旅行 📸✈️ 浪漫靈魂，尋找可以一起看日落的人。平時喜歡去咖啡廳，用文字記錄生活。',
    photos: [generateAvatar('小雨', 0), generateAvatar('小雨', 0, 1), generateAvatar('小雨', 0, 2)],
    aiPersonality: mockAIPersonalities[0],
    preferences: { ageMin: 24, ageMax: 32, genderPreference: ['male'], region: '台北市' },
    onboardingComplete: true,
    createdAt: '2026-01-15',
  },
  {
    id: 'user-2',
    name: '阿傑',
    age: 28,
    gender: 'male',
    bio: '工程師 / 業餘廚師 🍳 喜歡有效率的溝通。假日喜歡自己研究料理，偶爾去健身。尋找一起生活的夥伴。',
    photos: [generateAvatar('阿傑', 1), generateAvatar('阿傑', 1, 1), generateAvatar('阿傑', 1, 2)],
    aiPersonality: mockAIPersonalities[1],
    preferences: { ageMin: 22, ageMax: 30, genderPreference: ['female'], region: '台北市' },
    onboardingComplete: true,
    createdAt: '2026-01-20',
  },
  {
    id: 'user-3',
    name: '小晴',
    age: 24,
    gender: 'female',
    bio: '插畫家 🎨 到哪裡都是開心果！熱愛探索各種新事物，最近迷上了烘焙和手沖咖啡。',
    photos: [generateAvatar('小晴', 2), generateAvatar('小晴', 2, 1), generateAvatar('小晴', 2, 2)],
    aiPersonality: mockAIPersonalities[2],
    preferences: { ageMin: 24, ageMax: 35, genderPreference: ['male'], region: '新北市' },
    onboardingComplete: true,
    createdAt: '2026-02-01',
  },
  {
    id: 'user-4',
    name: '志明',
    age: 27,
    gender: 'male',
    bio: '自由工作者 / 咖啡愛好者 ☕ 喜歡安靜做自己的事，但也享受跟對的人深度聊天。養了一隻貓叫小橘。',
    photos: [generateAvatar('志明', 3), generateAvatar('志明', 3, 1), generateAvatar('志明', 3, 2)],
    aiPersonality: mockAIPersonalities[3],
    preferences: { ageMin: 22, ageMax: 30, genderPreference: ['female'], region: '台北市' },
    onboardingComplete: true,
    createdAt: '2026-02-05',
  },
  {
    id: 'user-5',
    name: '美玲',
    age: 26,
    gender: 'female',
    bio: '護理師 💉 天生的照顧者，朋友都叫我暖暖。喜歡做甜點分享給大家，希望找到能一起分擔生活的人。',
    photos: [generateAvatar('美玲', 4), generateAvatar('美玲', 4, 1), generateAvatar('美玲', 4, 2)],
    aiPersonality: mockAIPersonalities[4],
    preferences: { ageMin: 25, ageMax: 33, genderPreference: ['male'], region: '台中市' },
    onboardingComplete: true,
    createdAt: '2026-02-10',
  },
  {
    id: 'user-6',
    name: '大偉',
    age: 30,
    gender: 'male',
    bio: '行銷主管 📊 腦子裡永遠有各種點子。愛辯論但不會生氣，喜歡和有想法的人交流。假日喜歡衝浪。',
    photos: [generateAvatar('大偉', 5), generateAvatar('大偉', 5, 1), generateAvatar('大偉', 5, 2)],
    aiPersonality: mockAIPersonalities[5],
    preferences: { ageMin: 23, ageMax: 32, genderPreference: ['female'], region: '台北市' },
    onboardingComplete: true,
    createdAt: '2026-02-12',
  },
  {
    id: 'user-7',
    name: '思涵',
    age: 23,
    gender: 'female',
    bio: '大學研究生 📚 外冷內熱型。專注於自己的研究領域，但對喜歡的人超級用心。養了兩隻倉鼠。',
    photos: [generateAvatar('思涵', 6), generateAvatar('思涵', 6, 1), generateAvatar('思涵', 6, 2)],
    aiPersonality: mockAIPersonalities[6],
    preferences: { ageMin: 25, ageMax: 35, genderPreference: ['male'], region: '台北市' },
    onboardingComplete: true,
    createdAt: '2026-02-15',
  },
  {
    id: 'user-8',
    name: '家豪',
    age: 29,
    gender: 'male',
    bio: '健身教練 💪 活在當下的行動派！喜歡跟朋友聚會、嘗試新餐廳。正能量滿滿，希望找到一起冒險的人。',
    photos: [generateAvatar('家豪', 7), generateAvatar('家豪', 7, 1), generateAvatar('家豪', 7, 2)],
    aiPersonality: mockAIPersonalities[7],
    preferences: { ageMin: 21, ageMax: 30, genderPreference: ['female'], region: '新北市' },
    onboardingComplete: true,
    createdAt: '2026-02-18',
  },
  {
    id: 'user-9',
    name: '雅婷',
    age: 27,
    gender: 'female',
    bio: 'UI 設計師 🎨 安靜的美感追求者。喜歡逛美術館、拍照，在小巷子裡挖掘特色小店。最愛文青風格的生活。',
    photos: [generateAvatar('雅婷', 8), generateAvatar('雅婷', 8, 1), generateAvatar('雅婷', 8, 2)],
    aiPersonality: mockAIPersonalities[8],
    preferences: { ageMin: 26, ageMax: 34, genderPreference: ['male'], region: '台北市' },
    onboardingComplete: true,
    createdAt: '2026-02-20',
  },
  {
    id: 'user-10',
    name: '建宏',
    age: 31,
    gender: 'male',
    bio: '律師 ⚖️ 認真負責的人。在工作上全力以赴，在感情上也是同樣態度。喜歡閱讀推理小說和下棋。',
    photos: [generateAvatar('建宏', 9), generateAvatar('建宏', 9, 1), generateAvatar('建宏', 9, 2)],
    aiPersonality: mockAIPersonalities[9],
    preferences: { ageMin: 24, ageMax: 32, genderPreference: ['female'], region: '台北市' },
    onboardingComplete: true,
    createdAt: '2026-02-22',
  },
];
