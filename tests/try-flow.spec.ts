import { expect, test } from '@playwright/test';

const mockAnalysis = {
  personality: {
    bio: '週末喜歡做飯看電影，也喜歡傍晚去散步吹風。',
    personality_profile: {
      traits: [
        { name: '慢熱', score: 82, category: 'social' },
        { name: '重視節奏', score: 76, category: 'values' },
      ],
      values: ['舒服', '真誠', '穩定'],
    },
    dating_style: '慢慢熟起來比較自在。',
    communication_style: '不喜歡追問，會先留一點空間。',
    relationship_goal: '想找能認真相處、一起過生活的人。',
    red_flags: ['情緒勒索'],
    tags: ['#慢熱', '#重視空間'],
    scoring_features: {
      attachmentStyle: 'secure',
      socialEnergy: 45,
      conflictStyle: 'avoider',
      loveLanguage: '品質相伴',
      lifePace: 'moderate',
      emotionalDepth: 68,
    },
    chatSummary: '慢熱、重視節奏，想認真交往。',
  },
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem('mochi_analytics_consent', 'true');
  });
});

test('try page can complete mocked chat and show summary result', async ({ page }) => {
  let chatCalls = 0;

  await page.route('**/api/ai/chat', async (route) => {
    const payload = route.request().postDataJSON() as { action?: string };

    if (payload.action === 'chat') {
      chatCalls += 1;

      if (chatCalls === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            reply: '嗨！我是小默，先跟我說說你週末最喜歡怎麼過？',
            readyToAnalyze: false,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: '這樣我大概抓到你的節奏了，最後一題想問你現在比較想認真找對象，還是先認識看看？',
          readyToAnalyze: true,
        }),
      });
      return;
    }

    if (payload.action === 'analyze') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      });
      return;
    }

    await route.abort();
  });

  await page.goto('/try');
  await expect(page.getByText('體驗 Mochi 默契')).toBeVisible();
  await expect(page.getByText('嗨！我是小默')).toBeVisible();

  await page.getByTestId('try-chat-input').fill('我平常下班喜歡做飯，週末會去散步或看電影。');
  await page.getByTestId('try-send-button').click();

  await expect(page.getByText('✅ 可以先整理你的聊天摘要了！')).toBeVisible();
  await page.getByTestId('try-finish-chat').click();

  await expect(page.getByText('你的聊天摘要')).toBeVisible();
  await expect(page.getByText('週末喜歡做飯看電影，也喜歡傍晚去散步吹風。')).toBeVisible();
  await expect(page.getByRole('link', { name: '保留聊天內容，繼續註冊' })).toBeVisible();
});

test('try result is persisted and claim page can read it', async ({ page }) => {
  await page.addInitScript((analysis) => {
    window.localStorage.setItem('mochi_try_chat', JSON.stringify({
      messages: [
        { role: 'assistant', content: '嗨！我是小默。' },
        { role: 'user', content: '我喜歡做飯和散步。' },
      ],
      readyToAnalyze: true,
      result: {
        bio: analysis.personality.bio,
        traits: analysis.personality.personality_profile.traits,
        values: analysis.personality.personality_profile.values,
        datingStyle: analysis.personality.dating_style,
        communicationStyle: analysis.personality.communication_style,
        relationshipGoal: analysis.personality.relationship_goal,
        redFlags: analysis.personality.red_flags,
        tags: analysis.personality.tags,
        attachmentStyle: analysis.personality.scoring_features.attachmentStyle,
        conflictStyle: analysis.personality.scoring_features.conflictStyle,
        loveLanguage: analysis.personality.scoring_features.loveLanguage,
        lifePace: analysis.personality.scoring_features.lifePace,
      },
    }));
  }, mockAnalysis);

  await page.goto('/try/claim');

  await expect(page.getByText('先保存聊天內容，再完成註冊')).toBeVisible();
  await expect(page.getByText(mockAnalysis.personality.bio)).toBeVisible();
  await expect(page.getByTestId('try-claim-nickname')).toBeVisible();
});

test('claim page redirects back to try when there is no saved result', async ({ page }) => {
  await page.goto('/try/claim');
  await page.waitForURL('**/try');
  await expect(page.getByText('體驗 Mochi 默契')).toBeVisible();
});
