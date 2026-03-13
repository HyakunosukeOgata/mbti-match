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
  // Week 4 - 日常生活
  {
    id: 'w4q1',
    question: '你覺得理想的家是什麼樣子？',
    options: [
      '溫馨舒適，充滿生活感',
      '簡約整潔，一切井然有序',
      '有自己的小角落就好',
      '到處都是書和植物'
    ],
    category: '居住理想',
    week: 4
  },
  {
    id: 'w4q2',
    question: '你怎麼看待做家事這件事？',
    options: [
      '一起分工合作，公平分擔',
      '各自負責擅長的部分',
      '誰有空誰做，不計較',
      '可以的話希望外包（清潔阿姨等）'
    ],
    category: '生活分工',
    week: 4
  },
  {
    id: 'w4q3',
    question: '養寵物的話，你比較想養什麼？',
    options: [
      '狗，忠誠又熱情',
      '貓，獨立又療癒',
      '都喜歡，或想養特殊寵物',
      '目前不太想養'
    ],
    category: '寵物觀',
    week: 4
  },
  {
    id: 'w4q4',
    question: '下班或下課後，你通常怎麼度過？',
    options: [
      '和朋友約吃飯或聚會',
      '回家追劇、打遊戲、看書',
      '去運動或做些自己的事',
      '看心情決定，沒有固定模式'
    ],
    category: '日常習慣',
    week: 4
  },
  // Week 5 - 社交與友情
  {
    id: 'w5q1',
    question: '你的朋友圈大概是什麼樣的？',
    options: [
      '很多朋友，到處都認識人',
      '幾個知心好友就夠了',
      '不同圈子都有，但不太混在一起',
      '比較少朋友，但每段友情都很深'
    ],
    category: '社交風格',
    week: 5
  },
  {
    id: 'w5q2',
    question: '另一半和你的朋友不太合得來，你會？',
    options: [
      '嘗試製造機會讓他們多相處',
      '分開就好，不一定要融入彼此的圈子',
      '會有點困擾，但尊重各自的選擇',
      '覺得這蠻重要的，會認真溝通'
    ],
    category: '感情與社交',
    week: 5
  },
  {
    id: 'w5q3',
    question: '你覺得在感情中，對方的家人重要嗎？',
    options: [
      '非常重要，家庭關係影響很大',
      '尊重但不需要太過融入',
      '看情況，主要是我們兩人的事',
      '只要對方跟自己的家人處得好就行'
    ],
    category: '家庭觀延伸',
    week: 5
  },
  {
    id: 'w5q4',
    question: '你會介意另一半有很多異性朋友嗎？',
    options: [
      '完全不介意，相信對方',
      '稍微在意但可以接受',
      '希望能認識那些朋友',
      '會比較在意，需要安全感'
    ],
    category: '信任與安全感',
    week: 5
  },
  // Week 6 - 溝通深度
  {
    id: 'w6q1',
    question: '你習慣怎麼表達「我想你」？',
    options: [
      '直接說出來',
      '傳有趣的東西分享',
      '不太會主動說，但會默默關心',
      '用行動表示，例如買個小禮物'
    ],
    category: '表達方式',
    week: 6
  },
  {
    id: 'w6q2',
    question: '吵架冷戰中，你能忍多久不說話？',
    options: [
      '忍不了，一定會先開口',
      '一天左右就會受不了',
      '看事情嚴重程度，可以等幾天',
      '等對方先來找我'
    ],
    category: '衝突處理',
    week: 6
  },
  {
    id: 'w6q3',
    question: '你覺得情侶需要每天聊天嗎？',
    options: [
      '當然！不聊天會不安',
      '每天簡單聊一下就好',
      '不用每天，但要保持連結',
      '各自忙的時候不聊也沒關係'
    ],
    category: '聯繫頻率',
    week: 6
  },
  {
    id: 'w6q4',
    question: '你比較喜歡哪種約會方式？',
    options: [
      '精心規劃的浪漫約會',
      '隨意走走，去哪都開心',
      '在家一起煮飯看電影',
      '嘗試新的冒險活動'
    ],
    category: '約會風格',
    week: 6
  },
  // Week 7 - 價值觀深入
  {
    id: 'w7q1',
    question: '你怎麼看待婚姻？',
    options: [
      '很期待，是人生重要的目標',
      '順其自然，遇到對的人再說',
      '可有可無，在一起開心最重要',
      '目前沒有結婚的想法'
    ],
    category: '婚姻觀',
    week: 7
  },
  {
    id: 'w7q2',
    question: '你怎麼看待生小孩？',
    options: [
      '很期待成為父母',
      '看情況，不排斥也不強求',
      '目前比較傾向不生',
      '需要和另一半一起討論決定'
    ],
    category: '生育觀',
    week: 7
  },
  {
    id: 'w7q3',
    question: '如果另一半想搬到另一個城市或國家，你？',
    options: [
      '願意一起，在哪都好',
      '需要好好討論和計劃',
      '不太願意，喜歡目前的生活',
      '看機會和原因再決定'
    ],
    category: '生活變動',
    week: 7
  },
  {
    id: 'w7q4',
    question: '你理想中的退休生活是什麼樣子？',
    options: [
      '環遊世界，到處旅行',
      '找個安靜的地方過悠閒生活',
      '繼續做有意義的事（志工、教學...）',
      '太遠了，還沒想過'
    ],
    category: '未來想像',
    week: 7
  },
  // Week 8 - 情感與安全感
  {
    id: 'w8q1',
    question: '你覺得最浪漫的事是什麼？',
    options: [
      '記得每個重要的紀念日',
      '平凡日常中的小驚喜',
      '一起經歷困難後還在一起',
      '不需要特別浪漫，陪伴就好'
    ],
    category: '浪漫觀',
    week: 8
  },
  {
    id: 'w8q2',
    question: '你最希望另一半在哪方面支持你？',
    options: [
      '事業和工作上的支持',
      '情感和心理上的陪伴',
      '興趣和夢想的鼓勵',
      '生活上的實際幫助'
    ],
    category: '支持需求',
    week: 8
  },
  {
    id: 'w8q3',
    question: '你覺得感情出現問題時，最好的做法是？',
    options: [
      '馬上坐下來談、找出解決方案',
      '先各自冷靜，再找機會溝通',
      '找諮商師或第三方協助',
      '給彼此時間和空間自然解決'
    ],
    category: '問題解決',
    week: 8
  },
  {
    id: 'w8q4',
    question: '你比較在意另一半的哪個特質？',
    options: [
      '誠實和透明',
      '幽默和有趣',
      '溫柔和體貼',
      '上進和有能力'
    ],
    category: '理想特質',
    week: 8
  },
  // Week 9 - 生活觀念
  {
    id: 'w9q1',
    question: '你對健康和運動的態度是？',
    options: [
      '很重視，規律運動',
      '想運動但常常偷懶',
      '不太運動，但注意飲食',
      '順其自然，開心就好'
    ],
    category: '健康觀',
    week: 9
  },
  {
    id: 'w9q2',
    question: '你怎麼看待另一半的工作狂傾向？',
    options: [
      '理解支持，事業很重要',
      '適度就好，要有生活平衡',
      '希望對方能放更多心在關係上',
      '看情況，忙碌期可以接受'
    ],
    category: '工作與生活平衡',
    week: 9
  },
  {
    id: 'w9q3',
    question: '在金錢管理上，情侶應該怎麼做？',
    options: [
      'AA 制，各付各的',
      '共同帳戶，一起管理',
      '輪流或看誰賺比較多',
      '先談好比例，透明公開'
    ],
    category: '理財觀',
    week: 9
  },
  {
    id: 'w9q4',
    question: '你對社群媒體的使用態度是？',
    options: [
      '很活躍，喜歡分享生活',
      '偶爾瀏覽，不太發文',
      '幾乎不用，覺得浪費時間',
      '看心情，時多時少'
    ],
    category: '數位生活',
    week: 9
  },
  // Week 10 - 深層自我
  {
    id: 'w10q1',
    question: '你最害怕感情中發生什麼事？',
    options: [
      '被背叛或欺騙',
      '漸漸變成陌生人',
      '失去自我和獨立性',
      '對方突然消失或不聯絡'
    ],
    category: '恐懼與不安',
    week: 10
  },
  {
    id: 'w10q2',
    question: '你覺得什麼是真正的愛？',
    options: [
      '願意為對方付出一切',
      '能做真正的自己，被完全接受',
      '一起成長，互相激勵',
      '在一起時感到平靜和安心'
    ],
    category: '愛的定義',
    week: 10
  },
  {
    id: 'w10q3',
    question: '你最想改變自己的一個性格特點是？',
    options: [
      '太容易焦慮或想太多',
      '有時候太固執或控制慾強',
      '不太擅長表達感受',
      '容易心軟或優柔寡斷'
    ],
    category: '自我覺察',
    week: 10
  },
  {
    id: 'w10q4',
    question: '你覺得一段好的關係需要什麼來維持？',
    options: [
      '持續的溝通和理解',
      '各自有獨立空間和成長',
      '共同的目標和方向',
      '日常的小甜蜜和驚喜'
    ],
    category: '關係經營',
    week: 10
  },
  // Week 11 - 文化與興趣
  {
    id: 'w11q1',
    question: '你比較喜歡哪種音樂？',
    options: [
      '流行音樂 / K-pop / J-pop',
      '獨立音樂 / 民謠 / 爵士',
      '嘻哈 / R&B / 電子',
      '什麼都聽，看心情'
    ],
    category: '音樂品味',
    week: 11
  },
  {
    id: 'w11q2',
    question: '約會要一起看電影，你會選什麼類型？',
    options: [
      '浪漫愛情片',
      '驚悚懸疑或科幻',
      '搞笑喜劇',
      '紀錄片或文藝片'
    ],
    category: '影視品味',
    week: 11
  },
  {
    id: 'w11q3',
    question: '你覺得情侶一定要有共同興趣嗎？',
    options: [
      '是的，共同興趣很重要',
      '有一些就好，不用全部一樣',
      '不一定，互相尊重就好',
      '不同興趣反而可以互相學習'
    ],
    category: '興趣觀',
    week: 11
  },
  {
    id: 'w11q4',
    question: '你最近在學或想學的新技能是什麼？',
    options: [
      '語言（日文、英文、韓文...）',
      '料理或烘焙',
      '運動（健身、瑜珈、游泳...）',
      '藝術創作或音樂'
    ],
    category: '學習動力',
    week: 11
  },
  // Week 12 - 終極問題
  {
    id: 'w12q1',
    question: '如果只能用三個詞形容理想的另一半？',
    options: [
      '溫暖、真誠、有趣',
      '獨立、聰明、有想法',
      '可靠、穩定、包容',
      '浪漫、有品味、體貼'
    ],
    category: '理想另一半',
    week: 12
  },
  {
    id: 'w12q2',
    question: '你覺得感情中最值得珍惜的瞬間是？',
    options: [
      '一起大笑的時候',
      '脆弱時對方依然在的時候',
      '發現彼此很像的時候',
      '平凡日常中感到幸福的時候'
    ],
    category: '珍惜的時刻',
    week: 12
  },
  {
    id: 'w12q3',
    question: '十年後你希望自己在做什麼？',
    options: [
      '有穩定的事業和幸福的家庭',
      '實現夢想，做自己喜歡的事',
      '財務自由，有更多選擇',
      '還沒想太遠，活在當下就好'
    ],
    category: '十年願景',
    week: 12
  },
  {
    id: 'w12q4',
    question: '你認為什麼時候才算「準備好」談戀愛？',
    options: [
      '隨時都準備好了',
      '經濟和生活穩定的時候',
      '遇到對的人自然就準備好了',
      '先好好了解自己之後'
    ],
    category: '戀愛準備',
    week: 12
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
