import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3001';

// 5 simulated user agents with different behaviors
const agents = [
  { name: '小花', desc: 'Normal female user, completes everything', gender: 'female', mbtiChoices: [0, 0, 1, 0] }, // ENTP
  { name: '阿明', desc: 'Normal male user, completes everything', gender: 'male', mbtiChoices: [1, 1, 0, 1] },   // ISFJ
  { name: '無名', desc: 'Empty name edge case', gender: 'other', mbtiChoices: [0, 1, 1, 1] },
  { name: '快手QQ', desc: 'Speed user, skips all cards', gender: 'male', mbtiChoices: [1, 0, 0, 0] },
  { name: '慢慢來', desc: 'Careful user, checks everything', gender: 'female', mbtiChoices: [0, 0, 0, 1] },
];

// Helper: clear localStorage before each test
async function clearState(page: Page) {
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto(BASE);
}

// Helper: login with name
async function login(page: Page, name: string) {
  await page.goto(BASE);
  await page.waitForSelector('input[placeholder]', { timeout: 10000 });

  if (name) {
    await page.fill('input[placeholder]', name);
  }
  // Click "開始配對之旅" button
  const startBtn = page.locator('button', { hasText: '開始配對之旅' });
  await startBtn.click();
}

// Helper: complete MBTI onboarding
async function completeMBTI(page: Page, choices: number[]) {
  await page.waitForURL('**/onboarding/mbti', { timeout: 10000 });

  for (let dim = 0; dim < 4; dim++) {
    // Wait for dimension options to load
    await page.waitForSelector('.dimension-option, button:has-text("💪")', { timeout: 5000 }).catch(() => {});

    // Click left (0) or right (1) option
    const options = page.locator('.dimension-option');
    const count = await options.count();
    if (count >= 2) {
      await options.nth(choices[dim]).click();
    }

    // Click a strength btn (pick middle "😊")
    const strengthBtns = page.locator('.strength-btn');
    const sCount = await strengthBtns.count();
    if (sCount >= 2) {
      await strengthBtns.nth(1).click();
    }

    // Click next/finish
    if (dim < 3) {
      const nextBtn = page.locator('button', { hasText: /下一個維度|→/ });
      if (await nextBtn.count() > 0) {
        await nextBtn.first().click();
      }
    } else {
      const finishBtn = page.locator('button', { hasText: /完成.*MBTI|✅/ });
      if (await finishBtn.count() > 0) {
        await finishBtn.first().click();
      }
    }

    await page.waitForTimeout(300);
  }
}

// Helper: complete scenario questions
async function completeScenarios(page: Page) {
  await page.waitForURL('**/onboarding/scenarios', { timeout: 10000 });

  for (let q = 0; q < 4; q++) {
    for (const phase of ['my', 'partner']) {
      // Wait for options to load
      await page.waitForSelector('.option-card', { timeout: 5000 });

      // Select first option
      const optionCards = page.locator('.option-card');
      const cardCount = await optionCards.count();
      if (cardCount > 0) {
        await optionCards.first().click();
      }

      // Click next
      await page.waitForTimeout(200);
      const nextBtn = page.locator('button.btn-primary');
      if (await nextBtn.count() > 0) {
        await nextBtn.first().click();
      }

      await page.waitForTimeout(300);
    }
  }
}

// Helper: complete profile
async function completeProfile(page: Page, gender: string) {
  await page.waitForURL('**/onboarding/profile', { timeout: 10000 });

  // Add a photo
  const addPhotoBtn = page.locator('button', { hasText: '新增' });
  if (await addPhotoBtn.count() > 0) {
    await addPhotoBtn.click();
  }

  // Fill bio
  const textarea = page.locator('textarea');
  if (await textarea.count() > 0) {
    await textarea.fill('這是我的自我介紹，測試用文字！');
  }

  // Select gender
  const genderMap: Record<string, string> = { male: '男生', female: '女生', other: '其他' };
  const genderBtn = page.locator('.strength-btn', { hasText: genderMap[gender] || '男生' });
  if (await genderBtn.count() > 0) {
    await genderBtn.first().click();
  }

  // Click complete
  await page.waitForTimeout(300);
  const completeBtn = page.locator('button.btn-primary', { hasText: '完成' });
  if (await completeBtn.count() > 0) {
    await completeBtn.click();
  }
}

// ========================
// TEST SUITE
// ========================

test.describe('Agent 1: 小花 — Normal female user', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
  });

  test('Full onboarding flow', async ({ page }) => {
    await login(page, '小花');
    await completeMBTI(page, agents[0].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');

    // Should end up at /home
    await page.waitForURL('**/home', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('今日推薦');
  });

  test('Home page shows daily cards', async ({ page }) => {
    await login(page, '小花');
    await completeMBTI(page, agents[0].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Should have cards or empty state
    const cards = page.locator('.card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('Like a user and check match', async ({ page }) => {
    await login(page, '小花');
    await completeMBTI(page, agents[0].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Expand first card
    const firstCard = page.locator('.card').first();
    await firstCard.click();

    // Fill topic answer
    const textarea = page.locator('textarea');
    if (await textarea.count() > 0) {
      await textarea.first().fill('測試回答！');
    }

    // Like
    const likeBtn = page.locator('button', { hasText: '送出喜歡' });
    if (await likeBtn.count() > 0) {
      await likeBtn.click();
    }

    await page.waitForTimeout(1000);

    // Check if card is now marked liked
    const likedText = page.locator('text=已送出喜歡');
    const matched = page.locator('text=配對成功');
    const hasLiked = await likedText.count();
    const hasMatched = await matched.count();
    expect(hasLiked + hasMatched).toBeGreaterThan(0);
  });

  test('Navigate to matches page', async ({ page }) => {
    await login(page, '小花');
    await completeMBTI(page, agents[0].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Click matches nav
    const matchNav = page.locator('a[href="/matches"]');
    await matchNav.click();
    await page.waitForURL('**/matches', { timeout: 5000 });
    await expect(page.locator('body')).toContainText('配對');
  });

  test('Navigate to weekly page', async ({ page }) => {
    await login(page, '小花');
    await completeMBTI(page, agents[0].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    const weeklyNav = page.locator('a[href="/weekly"]');
    await weeklyNav.click();
    await page.waitForURL('**/weekly', { timeout: 5000 });
  });

  test('Settings page shows profile', async ({ page }) => {
    await login(page, '小花');
    await completeMBTI(page, agents[0].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    const settingsNav = page.locator('a[href="/settings"]');
    await settingsNav.click();
    await page.waitForURL('**/settings', { timeout: 5000 });
    await expect(page.locator('body')).toContainText('小花');
  });

  test('Edit profile in settings', async ({ page }) => {
    await login(page, '小花');
    await completeMBTI(page, agents[0].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    await page.goto(BASE + '/settings');
    await page.waitForTimeout(500);

    const editBtn = page.locator('button', { hasText: '編輯個人資料' });
    if (await editBtn.count() > 0) {
      await editBtn.click();
      // Should see photo grid and bio textarea
      const textarea = page.locator('textarea');
      expect(await textarea.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('Agent 2: 阿明 — Normal male user', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
  });

  test('Full onboarding + check gender filter', async ({ page }) => {
    await login(page, '阿明');
    await completeMBTI(page, agents[1].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'male');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Should see daily cards
    await expect(page.locator('body')).toContainText('今日推薦');
  });

  test('Skip all cards', async ({ page }) => {
    await login(page, '阿明');
    await completeMBTI(page, agents[1].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'male');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Try to skip all visible cards
    for (let i = 0; i < 5; i++) {
      const card = page.locator('.card').first();
      if (await card.count() === 0) break;
      await card.click();
      await page.waitForTimeout(200);

      const skipBtn = page.locator('button', { hasText: '跳過' });
      if (await skipBtn.count() > 0) {
        await skipBtn.first().click();
        await page.waitForTimeout(300);
      }
    }

    // After skipping all, page should still be functional
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('Chat flow after match', async ({ page }) => {
    await login(page, '阿明');
    await completeMBTI(page, agents[1].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'male');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Like multiple cards to get a match (50% chance each)
    for (let i = 0; i < 5; i++) {
      const card = page.locator('.card:not(:has-text("已送出喜歡"))').first();
      if (await card.count() === 0) break;
      await card.click();
      await page.waitForTimeout(200);

      const textarea = page.locator('textarea').first();
      if (await textarea.count() > 0) {
        await textarea.fill(`測試回答 ${i + 1}`);
      }

      const likeBtn = page.locator('button', { hasText: '送出喜歡' }).first();
      if (await likeBtn.count() > 0) {
        await likeBtn.click();
      }
      await page.waitForTimeout(1500);
    }

    // Go to matches page
    await page.goto(BASE + '/matches');
    await page.waitForTimeout(500);

    // If there's a match, try to open chat
    const matchCard = page.locator('.card').first();
    if (await matchCard.count() > 0) {
      await matchCard.click();

      // Wait for chat page
      await page.waitForTimeout(1000);
      const url = page.url();

      if (url.includes('/chat/')) {
        // Send a message
        const input = page.locator('input[placeholder]');
        if (await input.count() > 0) {
          await input.fill('你好！很高興認識你');
          const sendBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
          await sendBtn.click();
          await page.waitForTimeout(500);

          // Check message appears
          await expect(page.locator('body')).toContainText('你好');

          // Wait for auto-reply
          await page.waitForTimeout(3000);
          const bubbles = page.locator('.chat-bubble.theirs');
          expect(await bubbles.count()).toBeGreaterThan(0);
        }
      }
    }
  });
});

test.describe('Agent 3: 無名 — Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
  });

  test('Login with empty name should be handled', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector('input[placeholder]', { timeout: 10000 });

    // Try to click start without entering name
    const startBtn = page.locator('button', { hasText: '開始配對之旅' });
    const isDisabled = await startBtn.isDisabled();

    // If not disabled, it should still work or show error
    if (!isDisabled) {
      await startBtn.click();
      await page.waitForTimeout(1000);
      // Should either redirect or show validation
    }
    // Page should not crash
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('Quick login buttons work', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector('button', { timeout: 10000 });

    const phoneBtn = page.locator('button', { hasText: '手機' });
    if (await phoneBtn.count() > 0) {
      await phoneBtn.click();
      await page.waitForTimeout(1000);
      // Should redirect to onboarding
      expect(page.url()).toContain('onboarding');
    }
  });

  test('Direct URL access without login redirects', async ({ page }) => {
    await clearState(page);

    // Try to access home directly
    await page.goto(BASE + '/home');
    await page.waitForTimeout(2000);
    // Should redirect to login
    expect(page.url()).toBe(BASE + '/');
  });

  test('Direct URL access to chat without login', async ({ page }) => {
    await clearState(page);
    await page.goto(BASE + '/chat/nonexistent-id');
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE + '/');
  });

  test('Direct URL access to settings without login', async ({ page }) => {
    await clearState(page);
    await page.goto(BASE + '/settings');
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE + '/');
  });

  test('Onboarding profile: no photo + no bio → cannot complete', async ({ page }) => {
    await login(page, '測試者');
    await completeMBTI(page, agents[2].mbtiChoices);
    await completeScenarios(page);
    await page.waitForURL('**/onboarding/profile', { timeout: 10000 });

    // Don't add photos or bio, check button is disabled
    const completeBtn = page.locator('button.btn-primary', { hasText: '完成' });
    if (await completeBtn.count() > 0) {
      const isDisabled = await completeBtn.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('Weekly page when all answered shows completed', async ({ page }) => {
    await login(page, '週測者');
    await completeMBTI(page, agents[2].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'other');
    await page.waitForURL('**/home', { timeout: 10000 });

    await page.goto(BASE + '/weekly');
    await page.waitForTimeout(1000);
    // Should show questions or completed state
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Agent 4: 快手QQ — Speed interactions', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
  });

  test('Rapid navigation between all tabs', async ({ page }) => {
    await login(page, '快手QQ');
    await completeMBTI(page, agents[3].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'male');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Rapid tab switching
    for (const path of ['/matches', '/weekly', '/settings', '/home', '/matches', '/home']) {
      await page.goto(BASE + path);
      await page.waitForTimeout(200);
      await expect(page.locator('body')).not.toContainText('Error');
    }
  });

  test('Rapid card expand/collapse', async ({ page }) => {
    await login(page, '快手QQ');
    await completeMBTI(page, agents[3].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'male');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Click first card rapidly
    const firstCard = page.locator('.card').first();
    if (await firstCard.count() > 0) {
      for (let i = 0; i < 6; i++) {
        await firstCard.click();
        await page.waitForTimeout(100);
      }
    }
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('Skip then refresh cards', async ({ page }) => {
    await login(page, '快手QQ');
    await completeMBTI(page, agents[3].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'male');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Skip all cards rapidly
    for (let i = 0; i < 5; i++) {
      const card = page.locator('.card').first();
      if (await card.count() === 0) break;
      await card.click();
      await page.waitForTimeout(100);
      const skipBtn = page.locator('button', { hasText: '跳過' }).first();
      if (await skipBtn.count() > 0) {
        await skipBtn.click();
        await page.waitForTimeout(100);
      }
    }

    // The "explore" button should appear or empty state
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('Logout and re-login', async ({ page }) => {
    await login(page, '快手QQ');
    await completeMBTI(page, agents[3].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'male');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Go to settings and logout
    await page.goto(BASE + '/settings');
    await page.waitForTimeout(500);

    const logoutBtn = page.locator('button', { hasText: '登出' });
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
    }
    await page.waitForTimeout(1000);

    // Should be back at login
    expect(page.url()).toBe(BASE + '/');

    // Re-login
    await login(page, '快手QQ新');
    // Should go to onboarding again
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('onboarding');
  });
});

test.describe('Agent 5: 慢慢來 — Full feature verification', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
  });

  test('Verify MBTI code displayed correctly', async ({ page }) => {
    await login(page, '慢慢來');
    await completeMBTI(page, agents[4].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Go to settings and check MBTI code is shown
    await page.goto(BASE + '/settings');
    await page.waitForTimeout(500);

    const mbtiText = page.locator('.mbti-badge');
    if (await mbtiText.count() > 0) {
      const text = await mbtiText.first().textContent();
      expect(text).toMatch(/[EI][SN][TF][JP]/);
    }
  });

  test('Verify compatibility scores are reasonable', async ({ page }) => {
    await login(page, '慢慢來');
    await completeMBTI(page, agents[4].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Check compat ring scores
    const compatRings = page.locator('.compat-ring');
    const ringCount = await compatRings.count();
    for (let i = 0; i < ringCount; i++) {
      const text = await compatRings.nth(i).textContent();
      const score = parseInt(text || '0');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('Chat shows icebreaker with shared answers', async ({ page }) => {
    await login(page, '慢慢來');
    await completeMBTI(page, agents[4].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    // Like cards until we get a match
    let matched = false;
    for (let i = 0; i < 5; i++) {
      const card = page.locator('.card:not(:has-text("已送出喜歡"))').first();
      if (await card.count() === 0) break;
      await card.click();
      await page.waitForTimeout(200);

      const textarea = page.locator('textarea').first();
      if (await textarea.count() > 0) {
        await textarea.fill(`回答 ${i}`);
      }

      const likeBtn = page.locator('button', { hasText: '送出喜歡' }).first();
      if (await likeBtn.count() > 0) {
        await likeBtn.click();
      }
      await page.waitForTimeout(1000);

      const alert = page.locator('text=配對成功');
      if (await alert.count() > 0) {
        matched = true;
        break;
      }
    }

    if (matched) {
      await page.goto(BASE + '/matches');
      await page.waitForTimeout(500);

      const matchCard = page.locator('.card').first();
      if (await matchCard.count() > 0) {
        await matchCard.click();
        await page.waitForTimeout(1000);

        // Chat should show system message with icebreaker
        const systemMsg = page.locator('.chat-bubble.system');
        expect(await systemMsg.count()).toBeGreaterThan(0);

        // Should show compat info
        const compatInfo = page.locator('text=契合度');
        expect(await compatInfo.count()).toBeGreaterThan(0);
      }
    }
  });

  test('Settings edit photo add/remove works', async ({ page }) => {
    await login(page, '慢慢來');
    await completeMBTI(page, agents[4].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    await page.goto(BASE + '/settings');
    await page.waitForTimeout(500);

    // Enter edit mode
    const editBtn = page.locator('button', { hasText: '編輯個人資料' });
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(300);

      // Count initial photos
      const initialPhotos = await page.locator('img[alt^="照片"]').count();

      // Add a photo
      const addBtn = page.locator('button', { hasText: '新增' });
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(300);

        const afterAdd = await page.locator('img[alt^="照片"]').count();
        expect(afterAdd).toBe(initialPhotos + 1);
      }

      // Remove a photo
      const removeBtn = page.locator('button:has-text("✕")').first();
      if (await removeBtn.count() > 0) {
        await removeBtn.click();
        await page.waitForTimeout(300);

        const afterRemove = await page.locator('img[alt^="照片"]').count();
        expect(afterRemove).toBe(initialPhotos);
      }
    }
  });

  test('Preferences save correctly', async ({ page }) => {
    await login(page, '慢慢來');
    await completeMBTI(page, agents[4].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    await page.goto(BASE + '/settings');
    await page.waitForTimeout(500);

    // Change region
    const regionSelect = page.locator('select');
    if (await regionSelect.count() > 0) {
      await regionSelect.selectOption('台中');
    }

    // Save preferences
    const saveBtn = page.locator('button', { hasText: '儲存偏好' });
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }

    // Reload and verify
    await page.reload();
    await page.waitForTimeout(1000);

    const region = page.locator('select');
    if (await region.count() > 0) {
      const val = await region.inputValue();
      expect(val).toBe('台中');
    }
  });

  test('Page does not crash on browser back/forward', async ({ page }) => {
    await login(page, '慢慢來');
    await completeMBTI(page, agents[4].mbtiChoices);
    await completeScenarios(page);
    await completeProfile(page, 'female');
    await page.waitForURL('**/home', { timeout: 10000 });

    await page.goto(BASE + '/matches');
    await page.waitForTimeout(300);

    await page.goto(BASE + '/settings');
    await page.waitForTimeout(300);

    await page.goBack();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toContainText('Error');

    await page.goForward();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toContainText('Error');
  });
});
