// Seed script: Insert fake test users into Supabase for UI testing
// Usage: node seed-test-users.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iekiexpnezfehqccevdv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('請設定 SUPABASE_SERVICE_ROLE_KEY 環境變數');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Picsum photos (stable, no auth needed)
const photoSets = [
  ['https://i.pravatar.cc/800?img=1', 'https://picsum.photos/seed/a1/600/800', 'https://picsum.photos/seed/a2/600/800'],
  ['https://i.pravatar.cc/800?img=5', 'https://picsum.photos/seed/b1/600/800', 'https://picsum.photos/seed/b2/600/800', 'https://picsum.photos/seed/b3/600/800'],
  ['https://i.pravatar.cc/800?img=9', 'https://picsum.photos/seed/c1/600/800'],
  ['https://i.pravatar.cc/800?img=16', 'https://picsum.photos/seed/d1/600/800', 'https://picsum.photos/seed/d2/600/800'],
  ['https://i.pravatar.cc/800?img=25', 'https://picsum.photos/seed/e1/600/800', 'https://picsum.photos/seed/e2/600/800', 'https://picsum.photos/seed/e3/600/800', 'https://picsum.photos/seed/e4/600/800'],
];

const testUsers = [
  {
    name: '小雨',
    age: 26,
    gender: 'female',
    bio: '喜歡在雨天窩在咖啡廳看書 ☕📖 偶爾畫畫，最近迷上水彩。希望找到一個能一起安靜待著也不尷尬的人 🌧️',
    region: '台北市',
    ai_personality: {
      bio: '喜歡在雨天窩在咖啡廳看書，偶爾畫畫。希望找到一個能一起安靜待著也不尷尬的人。',
      traits: [
        { name: '內省型', score: 85, category: 'emotional' },
        { name: '藝術感強', score: 78, category: 'lifestyle' },
        { name: '重視深度連結', score: 90, category: 'values' },
      ],
      values: ['真誠', '創造力', '深度對話'],
      datingStyle: '慢熱穩定型，喜歡從朋友慢慢發展成更深的關係',
      communicationStyle: '溫和傾聽型，喜歡用文字表達，偶爾傳手繪插圖',
      relationshipGoal: '找到靈魂伴侶，不急但很認真',
      redFlags: ['太吵鬧', '不尊重個人空間'],
      tags: ['#慢熱', '#文藝', '#重視獨處', '#咖啡控', '#水彩'],
      scoringFeatures: {
        attachmentStyle: 'secure',
        socialEnergy: 30,
        conflictStyle: 'avoider',
        loveLanguage: '質量時間',
        lifePace: 'slow',
        emotionalDepth: 85,
      },
      chatSummary: '安靜內斂但很有想法，重視深度連結',
      analyzedAt: new Date().toISOString(),
    },
    preferences: { ageMin: 24, ageMax: 34, genderPreference: ['male'], region: '台北市', preferredRegions: ['台北市', '新北市'] },
  },
  {
    name: 'Max',
    age: 29,
    gender: 'male',
    bio: '軟體工程師 by day、吉他手 by night 🎸 週末喜歡爬山跟衝浪。正在學做義大利麵，歡迎來當白老鼠 🍝',
    region: '新北市',
    ai_personality: {
      bio: '平日寫程式，晚上彈吉他。週末不是在山上就是在海裡。最近迷上做義大利麵，歡迎當白老鼠。',
      traits: [
        { name: '外向活潑', score: 82, category: 'social' },
        { name: '冒險精神', score: 75, category: 'lifestyle' },
        { name: '幽默感', score: 88, category: 'social' },
      ],
      values: ['成長', '自由', '幽默'],
      datingStyle: '主動熱情型，喜歡約出去做事而不是只傳訊息',
      communicationStyle: '直接說型，愛開玩笑，回訊息很快',
      relationshipGoal: '認真交往，但希望過程輕鬆有趣',
      redFlags: ['已讀不回', '太黏'],
      tags: ['#外向', '#戶外派', '#工程師', '#音樂', '#愛下廚'],
      scoringFeatures: {
        attachmentStyle: 'secure',
        socialEnergy: 78,
        conflictStyle: 'confronter',
        loveLanguage: '肢體接觸',
        lifePace: 'fast',
        emotionalDepth: 55,
      },
      chatSummary: '開朗健談有幽默感，喜歡戶外活動',
      analyzedAt: new Date().toISOString(),
    },
    preferences: { ageMin: 22, ageMax: 32, genderPreference: ['female'], region: '新北市', preferredRegions: ['台北市', '新北市', '桃園市'] },
  },
  {
    name: '芷寧',
    age: 24,
    gender: 'female',
    bio: '剛從日本交換回來 🇯🇵 最想念的是深夜的便利商店和抹茶拿鐵。目前在新創公司做行銷，下班後是瑜珈時間 🧘‍♀️',
    region: '台北市',
    ai_personality: {
      bio: '剛從日本交換回來，最想念深夜便利商店和抹茶拿鐵。在新創做行銷，下班後是瑜珈時間。',
      traits: [
        { name: '好奇心強', score: 90, category: 'lifestyle' },
        { name: '獨立自主', score: 85, category: 'emotional' },
        { name: '重視成長', score: 80, category: 'values' },
      ],
      values: ['獨立', '探索', '平衡'],
      datingStyle: '自然認識型，順其自然但有在觀察',
      communicationStyle: '開放分享型，喜歡分享日常小事',
      relationshipGoal: '想找一個能互相支持成長的伴侶',
      redFlags: ['控制慾強', '不尊重對方的目標'],
      tags: ['#獨立', '#日本控', '#瑜珈', '#新創人', '#好奇寶寶'],
      scoringFeatures: {
        attachmentStyle: 'secure',
        socialEnergy: 65,
        conflictStyle: 'collaborator',
        loveLanguage: '肯定的言語',
        lifePace: 'moderate',
        emotionalDepth: 70,
      },
      chatSummary: '獨立有主見但很好相處，重視個人成長',
      analyzedAt: new Date().toISOString(),
    },
    preferences: { ageMin: 24, ageMax: 35, genderPreference: ['male'], region: '台北市', preferredRegions: ['台北市'] },
  },
  {
    name: '阿凱',
    age: 31,
    gender: 'male',
    bio: '在醫院工作，但下班後是個吃貨 🍜 台北哪裡有好吃的我大概都知道。養了一隻柯基叫「糰子」🐕 牠才是我的社交利器',
    region: '台北市',
    ai_personality: {
      bio: '醫院工作、下班開啟吃貨模式。台北好吃的我大概都知道。養了柯基「糰子」，牠才是社交利器。',
      traits: [
        { name: '溫暖體貼', score: 92, category: 'emotional' },
        { name: '責任感強', score: 88, category: 'values' },
        { name: '生活品味', score: 75, category: 'lifestyle' },
      ],
      values: ['穩定', '關懷', '生活品質'],
      datingStyle: '穩定經營型，喜歡用心安排約會',
      communicationStyle: '耐心傾聽型，會記住對方說過的話',
      relationshipGoal: '認真找對象，想要長期穩定的關係',
      redFlags: ['不守時', '對動物不友善'],
      tags: ['#暖男', '#吃貨', '#狗奴', '#穩定', '#醫療業'],
      scoringFeatures: {
        attachmentStyle: 'secure',
        socialEnergy: 55,
        conflictStyle: 'compromiser',
        loveLanguage: '服務的行動',
        lifePace: 'moderate',
        emotionalDepth: 80,
      },
      chatSummary: '成熟穩重很照顧人，重視穩定關係',
      analyzedAt: new Date().toISOString(),
    },
    preferences: { ageMin: 23, ageMax: 33, genderPreference: ['female'], region: '台北市', preferredRegions: ['台北市', '新北市'] },
  },
  {
    name: 'Mia',
    age: 27,
    gender: 'female',
    bio: '自由接案設計師 ✨ 最近在研究 UI 動效。喜歡逛美術館、聽 podcast 和研究咖啡。相信美好的事物值得等待 💫',
    region: '新北市',
    ai_personality: {
      bio: '自由接案設計師，最近在研究 UI 動效。逛美術館、聽 podcast、研究咖啡是日常。相信美好值得等待。',
      traits: [
        { name: '創意豐富', score: 88, category: 'lifestyle' },
        { name: '完美主義', score: 72, category: 'emotional' },
        { name: '獨立思考', score: 85, category: 'values' },
      ],
      values: ['美感', '自由', '品質'],
      datingStyle: '慢熱觀察型，不急但遇到對的人會很投入',
      communicationStyle: '慢熱但真誠，喜歡用圖片和 meme 溝通',
      relationshipGoal: '不急，但遇到對的人會很投入',
      redFlags: ['沒有審美', '不尊重對方的專業'],
      tags: ['#設計師', '#慢熱', '#美術館', '#咖啡', '#自由工作者', '#podcast'],
      scoringFeatures: {
        attachmentStyle: 'avoidant',
        socialEnergy: 40,
        conflictStyle: 'avoider',
        loveLanguage: '質量時間',
        lifePace: 'slow',
        emotionalDepth: 75,
      },
      chatSummary: '有想法有品味，慢熱但真誠',
      analyzedAt: new Date().toISOString(),
    },
    preferences: { ageMin: 26, ageMax: 36, genderPreference: ['male'], region: '新北市', preferredRegions: ['台北市', '新北市'] },
  },
];

async function seed() {
  console.log('🌱 開始建立測試用戶...\n');

  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    const photos = photoSets[i];

    // Check if user already exists by name (avoid duplicates)
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('name', user.name)
      .is('auth_id', null)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing user's ai_personality with new fields
      const { error: updateError } = await supabase
        .from('users')
        .update({ ai_personality: user.ai_personality })
        .eq('id', existing[0].id);
      if (updateError) {
        console.error(`  ⚠️ ${user.name} 更新失敗:`, updateError.message);
      } else {
        console.log(`🔄 ${user.name} 已更新 ai_personality`);
      }
      continue;
    }

    // Insert user (auth_id = null → demo/fake user, won't interfere with real auth)
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: null,
        name: user.name,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        region: user.region,
        ai_personality: user.ai_personality,
        preferences: user.preferences,
        onboarding_complete: true,
        profile_visible: true,
        hide_age: false,
      })
      .select('id')
      .single();

    if (userError) {
      console.error(`❌ ${user.name} 建立失敗:`, userError.message);
      continue;
    }

    // Insert photos
    const photoRows = photos.map((url, idx) => ({
      user_id: newUser.id,
      url,
      sort_order: idx,
    }));
    const { error: photoError } = await supabase.from('user_photos').insert(photoRows);
    if (photoError) {
      console.error(`  ⚠️ ${user.name} 照片插入失敗:`, photoError.message);
    }

    console.log(`✅ ${user.name} (${user.age}歲 ${user.gender}) — ${photos.length} 張照片`);
  }

  console.log('\n🎉 測試用戶建立完成！重新整理首頁即可看到推薦。');
}

seed().catch(console.error);
