import { ScenarioQuestion, ConversationTopic, UserProfile } from './types';

// ============================
// 情境題庫
// ============================
export const scenarioQuestions: ScenarioQuestion[] = [
  // Week 1 - 關係與溝通
  {
    id: 'w1q1',
    question: '你覺得感情中最重要的是什麼？',
    options: [
      '信任與忠誠',
      '互相尊重與理解',
      '有共同的目標和方向',
      '情感上的連結和陪伴'
    ],
    category: '關係價值觀',
    week: 1
  },
  {
    id: 'w1q2',
    question: '和另一半發生爭執時，你傾向怎麼處理？',
    options: [
      '當下直接溝通，把話講清楚',
      '先冷靜一下再找機會談',
      '寫訊息表達，比較能整理想法',
      '希望對方主動來找我談'
    ],
    category: '溝通方式',
    week: 1
  },
  {
    id: 'w1q3',
    question: '你理想中的週末是怎樣的？',
    options: [
      '和一群朋友聚會、唱歌',
      '和另一半兩個人享受約會',
      '各自做自己的事，晚上再聊聊',
      '一起嘗試新事物（探店、展覽、戶外）'
    ],
    category: '生活節奏',
    week: 1
  },
  {
    id: 'w1q4',
    question: '你怎麼看「個人空間」這件事？',
    options: [
      '很重要，每個人都需要獨處的時間',
      '可以有，但不需要太多',
      '看情況，有時需要有時不需要',
      '比起獨處，我更享受和對方在一起'
    ],
    category: '相處模式',
    week: 1
  },
  // Week 2 - 生活觀與未來
  {
    id: 'w2q1',
    question: '你對未來五年有什麼想法？',
    options: [
      '專注事業和個人成長',
      '希望穩定下來，找到生活的節奏',
      '沒有太明確的計劃，走一步算一步',
      '想多嘗試不同的體驗和可能性'
    ],
    category: '人生規劃',
    week: 2
  },
  {
    id: 'w2q2',
    question: '花錢這件事，你的態度比較接近？',
    options: [
      '能省則省，安全感很重要',
      '有計劃地花，該花的不手軟',
      '比較隨性，當下開心就好',
      '願意投資在體驗和成長上'
    ],
    category: '金錢觀',
    week: 2
  },
  {
    id: 'w2q3',
    question: '在感情裡遇到困難，你通常會？',
    options: [
      '和對方一起面對、討論解決方法',
      '先自己想清楚再跟對方說',
      '找信任的朋友聊聊、聽聽建議',
      '希望順其自然，時間會解決'
    ],
    category: '面對問題',
    week: 2
  },
  {
    id: 'w2q4',
    question: '你覺得什麼樣的陪伴最讓你感到被愛？',
    options: [
      '對方記得你說過的小事',
      '在你需要的時候出現在身邊',
      '用行動幫你解決問題',
      '經常表達愛意和肯定'
    ],
    category: '愛的語言',
    week: 2
  },
  // Week 3 - 深層價值觀
  {
    id: 'w3q1',
    question: '你怎麼看待「家庭」這件事？',
    options: [
      '家庭是最重要的，一切以家人優先',
      '家庭重要，但也要保有自我',
      '順其自然，不需要特別強調',
      '經營好自己的小家庭就好'
    ],
    category: '家庭觀',
    week: 3
  },
  {
    id: 'w3q2',
    question: '壓力大或心情不好的時候，你希望另一半怎麼做？',
    options: [
      '主動關心我、陪在我身邊',
      '給我空間，等我準備好再聊',
      '帶我去做開心的事分散注意力',
      '用理性幫我分析問題、提供建議'
    ],
    category: '情緒支持',
    week: 3
  },
  {
    id: 'w3q3',
    question: '你覺得兩個人在一起最不能忍受的是？',
    options: [
      '說謊或隱瞞',
      '不尊重對方的想法和感受',
      '太黏或控制慾太強',
      '不願意溝通、冷暴力'
    ],
    category: '底線原則',
    week: 3
  },
  {
    id: 'w3q4',
    question: '你對「成功」的定義比較接近什麼？',
    options: [
      '在事業上有所成就',
      '擁有穩定幸福的家庭和關係',
      '能自由地做自己想做的事',
      '對社會或他人有正面影響'
    ],
    category: '人生價值',
    week: 3
  },
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

function generateAvatar(name: string, colorIndex: number): string {
  // 用 data URI 生成簡單的 SVG 頭像
  const color = avatarColors[colorIndex % avatarColors.length];
  const initial = name.charAt(0);
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${color}"/><text x="100" y="120" text-anchor="middle" font-size="80" font-family="Arial" fill="white">${initial}</text></svg>`)}`;
}

export const mockUsers: UserProfile[] = [
  {
    id: 'user-1',
    name: '小雨',
    age: 25,
    gender: 'female',
    bio: '喜歡攝影和旅行 📸✈️ INFP的浪漫靈魂，尋找可以一起看日落的人。平時喜歡去咖啡廳，用文字記錄生活。',
    photos: [generateAvatar('小雨', 0)],
    mbti: {
      EI: { type: 'I', strength: 75 },
      SN: { type: 'N', strength: 100 },
      TF: { type: 'F', strength: 75 },
      JP: { type: 'P', strength: 50 },
    },
    mbtiCode: 'INFP',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [1, 3], partnerAnswer: [2, 3] },
      { questionId: 'w1q2', myAnswer: [2], partnerAnswer: [1, 2] },
      { questionId: 'w1q3', myAnswer: [1], partnerAnswer: [1] },
      { questionId: 'w1q4', myAnswer: [1], partnerAnswer: [0] },
    ],
    preferences: { ageMin: 24, ageMax: 32, genderPreference: ['male'], region: '台北' },
    onboardingComplete: true,
    createdAt: '2026-01-15',
  },
  {
    id: 'user-2',
    name: '阿傑',
    age: 28,
    gender: 'male',
    bio: '工程師 / 業餘廚師 🍳 ENTJ 喜歡有效率的溝通。假日喜歡自己研究料理，偶爾去健身。尋找一起生活的夥伴。',
    photos: [generateAvatar('阿傑', 1)],
    mbti: {
      EI: { type: 'E', strength: 75 },
      SN: { type: 'N', strength: 75 },
      TF: { type: 'T', strength: 100 },
      JP: { type: 'J', strength: 75 },
    },
    mbtiCode: 'ENTJ',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [0], partnerAnswer: [2, 3] },
      { questionId: 'w1q2', myAnswer: [3], partnerAnswer: [0, 3] },
      { questionId: 'w1q3', myAnswer: [0], partnerAnswer: [0] },
      { questionId: 'w1q4', myAnswer: [2], partnerAnswer: [0, 2] },
    ],
    preferences: { ageMin: 22, ageMax: 30, genderPreference: ['female'], region: '台北' },
    onboardingComplete: true,
    createdAt: '2026-01-20',
  },
  {
    id: 'user-3',
    name: '小晴',
    age: 24,
    gender: 'female',
    bio: '插畫家 🎨 ENFP 到哪裡都是開心果！熱愛探索各種新事物，最近迷上了烘焙和手沖咖啡。',
    photos: [generateAvatar('小晴', 2)],
    mbti: {
      EI: { type: 'E', strength: 100 },
      SN: { type: 'N', strength: 75 },
      TF: { type: 'F', strength: 100 },
      JP: { type: 'P', strength: 75 },
    },
    mbtiCode: 'ENFP',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [0, 3], partnerAnswer: [0, 2] },
      { questionId: 'w1q2', myAnswer: [0, 3], partnerAnswer: [3] },
      { questionId: 'w1q3', myAnswer: [3], partnerAnswer: [1] },
      { questionId: 'w1q4', myAnswer: [0], partnerAnswer: [0, 3] },
    ],
    preferences: { ageMin: 24, ageMax: 35, genderPreference: ['male'], region: '新北' },
    onboardingComplete: true,
    createdAt: '2026-02-01',
  },
  {
    id: 'user-4',
    name: '志明',
    age: 27,
    gender: 'male',
    bio: '自由工作者 / 咖啡愛好者 ☕ ISTP 喜歡安靜做自己的事，但也享受跟對的人深度聊天。養了一隻貓叫小橘。',
    photos: [generateAvatar('志明', 3)],
    mbti: {
      EI: { type: 'I', strength: 75 },
      SN: { type: 'S', strength: 50 },
      TF: { type: 'T', strength: 75 },
      JP: { type: 'P', strength: 100 },
    },
    mbtiCode: 'ISTP',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [1, 3], partnerAnswer: [1] },
      { questionId: 'w1q2', myAnswer: [2], partnerAnswer: [2] },
      { questionId: 'w1q3', myAnswer: [1], partnerAnswer: [3] },
      { questionId: 'w1q4', myAnswer: [0], partnerAnswer: [1] },
    ],
    preferences: { ageMin: 22, ageMax: 30, genderPreference: ['female'], region: '台北' },
    onboardingComplete: true,
    createdAt: '2026-02-05',
  },
  {
    id: 'user-5',
    name: '美玲',
    age: 26,
    gender: 'female',
    bio: '護理師 💉 ESFJ 天生的照顧者，朋友都叫我暖暖。喜歡做甜點分享給大家，希望找到能一起分擔生活的人。',
    photos: [generateAvatar('美玲', 4)],
    mbti: {
      EI: { type: 'E', strength: 75 },
      SN: { type: 'S', strength: 75 },
      TF: { type: 'F', strength: 100 },
      JP: { type: 'J', strength: 75 },
    },
    mbtiCode: 'ESFJ',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [0], partnerAnswer: [0, 3] },
      { questionId: 'w1q2', myAnswer: [0, 1], partnerAnswer: [1] },
      { questionId: 'w1q3', myAnswer: [2], partnerAnswer: [0] },
      { questionId: 'w1q4', myAnswer: [1], partnerAnswer: [2] },
    ],
    preferences: { ageMin: 25, ageMax: 33, genderPreference: ['male'], region: '台中' },
    onboardingComplete: true,
    createdAt: '2026-02-10',
  },
  {
    id: 'user-6',
    name: '大偉',
    age: 30,
    gender: 'male',
    bio: '行銷主管 📊 ENTP 腦子裡永遠有各種點子。愛辯論但不會生氣，喜歡和有想法的人交流。假日喜歡衝浪。',
    photos: [generateAvatar('大偉', 5)],
    mbti: {
      EI: { type: 'E', strength: 100 },
      SN: { type: 'N', strength: 100 },
      TF: { type: 'T', strength: 75 },
      JP: { type: 'P', strength: 75 },
    },
    mbtiCode: 'ENTP',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [0, 2], partnerAnswer: [0] },
      { questionId: 'w1q2', myAnswer: [3], partnerAnswer: [0, 3] },
      { questionId: 'w1q3', myAnswer: [0], partnerAnswer: [0, 3] },
      { questionId: 'w1q4', myAnswer: [3], partnerAnswer: [3] },
    ],
    preferences: { ageMin: 23, ageMax: 32, genderPreference: ['female'], region: '台北' },
    onboardingComplete: true,
    createdAt: '2026-02-12',
  },
  {
    id: 'user-7',
    name: '思涵',
    age: 23,
    gender: 'female',
    bio: '大學研究生 📚 INTJ 外冷內熱型。專注於自己的研究領域，但對喜歡的人超級用心。養了兩隻倉鼠。',
    photos: [generateAvatar('思涵', 6)],
    mbti: {
      EI: { type: 'I', strength: 100 },
      SN: { type: 'N', strength: 100 },
      TF: { type: 'T', strength: 75 },
      JP: { type: 'J', strength: 100 },
    },
    mbtiCode: 'INTJ',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [1], partnerAnswer: [1, 3] },
      { questionId: 'w1q2', myAnswer: [2], partnerAnswer: [1, 2] },
      { questionId: 'w1q3', myAnswer: [0], partnerAnswer: [1] },
      { questionId: 'w1q4', myAnswer: [2], partnerAnswer: [0] },
    ],
    preferences: { ageMin: 25, ageMax: 35, genderPreference: ['male'], region: '台北' },
    onboardingComplete: true,
    createdAt: '2026-02-15',
  },
  {
    id: 'user-8',
    name: '家豪',
    age: 29,
    gender: 'male',
    bio: '健身教練 💪 ESFP 活在當下的行動派！喜歡跟朋友聚會、嘗試新餐廳。正能量滿滿，希望找到一起冒險的人。',
    photos: [generateAvatar('家豪', 7)],
    mbti: {
      EI: { type: 'E', strength: 100 },
      SN: { type: 'S', strength: 75 },
      TF: { type: 'F', strength: 50 },
      JP: { type: 'P', strength: 100 },
    },
    mbtiCode: 'ESFP',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [0, 2], partnerAnswer: [0, 2] },
      { questionId: 'w1q2', myAnswer: [0, 3], partnerAnswer: [0] },
      { questionId: 'w1q3', myAnswer: [3], partnerAnswer: [3] },
      { questionId: 'w1q4', myAnswer: [0], partnerAnswer: [0] },
    ],
    preferences: { ageMin: 21, ageMax: 30, genderPreference: ['female'], region: '新北' },
    onboardingComplete: true,
    createdAt: '2026-02-18',
  },
  {
    id: 'user-9',
    name: '雅婷',
    age: 27,
    gender: 'female',
    bio: 'UI 設計師 🎨 ISFP 安靜的美感追求者。喜歡逛美術館、拍照，在小巷子裡挖掘特色小店。最愛文青風格的生活。',
    photos: [generateAvatar('雅婷', 8)],
    mbti: {
      EI: { type: 'I', strength: 50 },
      SN: { type: 'S', strength: 50 },
      TF: { type: 'F', strength: 75 },
      JP: { type: 'P', strength: 75 },
    },
    mbtiCode: 'ISFP',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [1, 3], partnerAnswer: [2, 3] },
      { questionId: 'w1q2', myAnswer: [1], partnerAnswer: [1, 3] },
      { questionId: 'w1q3', myAnswer: [2], partnerAnswer: [1, 2] },
      { questionId: 'w1q4', myAnswer: [1], partnerAnswer: [1] },
    ],
    preferences: { ageMin: 26, ageMax: 34, genderPreference: ['male'], region: '台北' },
    onboardingComplete: true,
    createdAt: '2026-02-20',
  },
  {
    id: 'user-10',
    name: '建宏',
    age: 31,
    gender: 'male',
    bio: '律師 ⚖️ ISTJ 認真負責的人。在工作上全力以赴，在感情上也是同樣態度。喜歡閱讀推理小說和下棋。',
    photos: [generateAvatar('建宏', 9)],
    mbti: {
      EI: { type: 'I', strength: 75 },
      SN: { type: 'S', strength: 100 },
      TF: { type: 'T', strength: 100 },
      JP: { type: 'J', strength: 100 },
    },
    mbtiCode: 'ISTJ',
    scenarioAnswers: [
      { questionId: 'w1q1', myAnswer: [1, 2], partnerAnswer: [1] },
      { questionId: 'w1q2', myAnswer: [2], partnerAnswer: [1, 2] },
      { questionId: 'w1q3', myAnswer: [0], partnerAnswer: [0] },
      { questionId: 'w1q4', myAnswer: [2], partnerAnswer: [2] },
    ],
    preferences: { ageMin: 24, ageMax: 32, genderPreference: ['female'], region: '台北' },
    onboardingComplete: true,
    createdAt: '2026-02-22',
  },
];
