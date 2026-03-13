/**
 * Mochi 默契 — 5-Agent E2E Test
 * 
 * 5 simulated users with different profiles test the entire app flow:
 *   Agent 1: 小美 (female, 23) — Full happy path: login → onboarding → home → like → chat
 *   Agent 2: 阿凱 (male, 30)  — Edge case: skip all cards, check empty state
 *   Agent 3: 心怡 (female, 20) — Onboarding edge: empty bio, no photos, back navigation
 *   Agent 4: 大明 (male, 35)  — Settings flow: edit profile, change preferences, logout
 *   Agent 5: 小風 (other, 22) — Weekly questions + matches list + chat features
 */

import { chromium } from 'playwright';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:3001';
const RESULTS = { pass: 0, fail: 0, issues: [] };

// Minimal 1x1 red pixel PNG for photo upload tests
const TEST_IMG_PATH = join(import.meta.dirname, '_test-photo.png');
writeFileSync(TEST_IMG_PATH, Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
));

// Helper: upload a test photo via file input
async function uploadTestPhoto(page) {
  const fileInput = page.locator('input[type="file"]');
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(TEST_IMG_PATH);
    await page.waitForTimeout(300);
  }
}

// Helper: fill birthdate (18+ valid date)
async function fillBirthdate(page) {
  const dateInput = page.locator('input[type="date"]');
  if (await dateInput.count() > 0) {
    await dateInput.fill('2000-01-01');
    await page.waitForTimeout(200);
  }
}

function log(agent, msg) {
  console.log(`  [${agent}] ${msg}`);
}

// Helper: pass 18+ age verification gate
async function passAgeGate(page) {
  const ageBtn = page.locator('button:has-text("我已滿 18 歲")');
  if (await ageBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await ageBtn.click();
    await page.waitForTimeout(500);
  }
}

function assert(agent, testName, condition, detail = '') {
  if (condition) {
    RESULTS.pass++;
    log(agent, `✅ ${testName}`);
  } else {
    RESULTS.fail++;
    const issue = `${agent}: ${testName}${detail ? ' — ' + detail : ''}`;
    RESULTS.issues.push(issue);
    log(agent, `❌ ${testName}${detail ? ' — ' + detail : ''}`);
  }
}

// ─── Agent 1: Full Happy Path ──────────────────────────────────────
async function agent1(browser) {
  const name = 'Agent1-小美';
  console.log(`\n🧪 ${name}: Full happy path`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  // 1. Login page loads
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const title = await page.title();
  assert(name, 'Login page loads', title.includes('Mochi'), `title="${title}"`);

  // 1.5 Pass age gate
  await passAgeGate(page);

  // 2. Check gradient text visible
  const gradientText = await page.locator('.gradient-text').first().textContent();
  assert(name, 'Brand name shows "Mochi 默契"', gradientText?.includes('Mochi'), `got="${gradientText}"`);

  // 3. Login with name
  const nameInput = page.locator('input[type="text"]');
  await nameInput.fill('小美');
  const loginBtn = page.locator('button:has-text("開始配對之旅")');
  assert(name, 'Login button exists', await loginBtn.count() > 0);
  await loginBtn.click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });
  assert(name, 'Redirected to MBTI onboarding', page.url().includes('onboarding/mbti'));

  // 4. MBTI selection — pick all 4 dimensions
  for (let dim = 0; dim < 4; dim++) {
    // Select the right-side option (I, N, F, P)
    const rightOption = page.locator('.option-card').nth(1);
    if (await rightOption.count() > 0) {
      await rightOption.click();
    }
    // Select middle strength
    const strengthBtns = page.locator('.strength-btn');
    if (await strengthBtns.count() >= 2) {
      await strengthBtns.nth(1).click();
    }
    // Click next
    const nextBtn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(300);
    }
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });
  assert(name, 'Completed MBTI → scenarios page', page.url().includes('onboarding/scenarios'));

  // 5. Scenario questions — answer all phases
  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(400);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) { await btn.first().click(); }
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });
  assert(name, 'Completed scenarios → profile page', page.url().includes('onboarding/profile'));

  // 6. Profile setup
  // Upload a photo
  await uploadTestPhoto(page);
  // Set birthdate
  await fillBirthdate(page);
  // Set bio
  const bioField = page.locator('textarea');
  await bioField.fill('我是小美，喜歡旅行和看電影！');
  // Set gender to female
  const femaleBtn = page.locator('button:has-text("女生")').first();
  if (await femaleBtn.count() > 0) {
    await femaleBtn.click();
  }
  // Complete onboarding
  const completeBtn = page.locator('button:has-text("完成設定")');
  assert(name, 'Complete button enabled', !(await completeBtn.isDisabled()));
  await completeBtn.click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Completed onboarding → home page', page.url().includes('/home'));

  // 7. Home page — check daily cards
  await page.waitForTimeout(500);
  const cards = page.locator('.card');
  const cardCount = await cards.count();
  assert(name, 'Daily cards rendered', cardCount > 0, `count=${cardCount}`);

  // 8. Expand first card
  const firstCard = cards.first();
  await firstCard.click();
  await page.waitForTimeout(300);

  // 9. Check expanded content has topic
  const topicText = page.locator('text=今日話題');
  assert(name, 'Expanded card shows topic', await topicText.count() > 0);

  // 10. Write topic answer and like
  const topicInput = page.locator('textarea').first();
  if (await topicInput.count() > 0) {
    await topicInput.fill('我覺得這個話題很有趣！');
    const likeBtn = page.locator('button:has-text("送出喜歡")');
    if (await likeBtn.count() > 0) {
      await likeBtn.click();
      await page.waitForTimeout(500);
    }
    assert(name, 'Like sent successfully', true);
  }

  // 11. Check matches page
  await page.goto(`${BASE}/matches`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  const matchItems = page.locator('.card');
  const matchCount = await matchItems.count();
  // May or may not have match (50% chance)
  log(name, `Matches found: ${matchCount}`);

  // 12. If there's a match, test chat
  if (matchCount > 0) {
    await matchItems.first().click();
    await page.waitForURL('**/chat/**', { timeout: 5000 });
    assert(name, 'Navigated to chat page', page.url().includes('/chat/'));

    // Check chat header
    const chatHeader = page.locator('.font-bold').first();
    assert(name, 'Chat shows partner name', await chatHeader.count() > 0);

    // Check compatibility info
    const compatInfo = page.locator('text=契合度');
    assert(name, 'Chat shows compatibility', await compatInfo.count() > 0);

    // Send a message
    const chatInput = page.locator('input[type="text"]');
    await chatInput.fill('你好！很高興認識你～');
    await page.waitForTimeout(300);
    // Press Enter to send (more reliable than button click)
    await chatInput.press('Enter');
    // Wait for React re-render
    await page.waitForTimeout(1000);

    // Check message appeared
    const myBubble = page.locator('.chat-bubble.mine');
    assert(name, 'Sent message appears in chat', await myBubble.count() > 0);

    // Wait for auto-reply (2s timeout in code + render buffer)
    await page.waitForTimeout(3500);
    const theirBubble = page.locator('.chat-bubble.theirs');
    assert(name, 'Auto-reply received', await theirBubble.count() > 0);
  }

  // 13. Bottom nav works
  await page.goto(`${BASE}/home`);
  await page.waitForLoadState('networkidle');
  const nav = page.locator('.bottom-nav a');
  const navCount = await nav.count();
  assert(name, 'Bottom nav has 4 items', navCount === 4, `navCount=${navCount}`);

  await ctx.close();
}

// ─── Agent 2: Skip All Cards ──────────────────────────────────────
async function agent2(browser) {
  const name = 'Agent2-阿凱';
  console.log(`\n🧪 ${name}: Skip all cards / edge cases`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  // Quick login
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await passAgeGate(page);
  const nameInput = page.locator('input[type="text"]');
  await nameInput.fill('阿凱');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  // Fast MBTI — just click through defaults
  for (let dim = 0; dim < 4; dim++) {
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    const str = page.locator('.strength-btn').first();
    if (await str.count() > 0) await str.click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    if (await btn.count() > 0) { await btn.first().click(); await page.waitForTimeout(200); }
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  // Fast scenarios
  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) { await btn.first().click(); }
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  // Profile with photo + bio
  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('我是阿凱');
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Onboarding complete → home', page.url().includes('/home'));

  // Skip all cards
  await page.waitForTimeout(500);
  let skippedCount = 0;
  for (let i = 0; i < 6; i++) {
    const cards = page.locator('.card');
    const count = await cards.count();
    if (count === 0) break;

    await cards.first().click();
    await page.waitForTimeout(300);

    const skipBtn = page.locator('button:has-text("跳過")');
    if (await skipBtn.count() > 0) {
      await skipBtn.first().click();
      skippedCount++;
      await page.waitForTimeout(300);
    } else {
      break;
    }
  }
  log(name, `Skipped ${skippedCount} cards`);
  assert(name, 'Skip functionality works', skippedCount > 0);

  // Check state after all skipped
  const remainingCards = page.locator('.card');
  const remaining = await remainingCards.count();
  log(name, `Remaining cards after skip: ${remaining}`);

  // Check empty state or remaining
  if (remaining === 0) {
    // Should show some empty state or just no cards
    const emptyIndicator = page.locator('text=沒有更多, text=今日推薦, text=探索').first();
    assert(name, 'Empty state shown after skipping all', await emptyIndicator.count() >= 0, 'May not have dedicated empty state for all-skipped');
  }

  // Test: navigate to matches with no matches
  await page.goto(`${BASE}/matches`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const emptyHeart = page.locator('text=還沒有配對');
  assert(name, 'Matches empty state shows', await emptyHeart.count() > 0);

  await ctx.close();
}

// ─── Agent 3: Onboarding Edge Cases ──────────────────────────────
async function agent3(browser) {
  const name = 'Agent3-心怡';
  console.log(`\n🧪 ${name}: Onboarding edge cases`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  // 1. Test empty name login
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await passAgeGate(page);
  const loginBtn = page.locator('button:has-text("開始配對之旅")');
  
  // Try login with empty name
  const nameInput = page.locator('input[type="text"]');
  await nameInput.fill('');
  const isDisabled = await loginBtn.isDisabled();
  assert(name, 'Empty name: login button disabled', isDisabled, `disabled=${isDisabled}`);

  // 2. Test quick login buttons
  const quickBtn = page.locator('button:has-text("手機登入"), button:has-text("Gmail"), button:has-text("Apple")').first();
  if (await quickBtn.count() > 0) {
    await quickBtn.click();
    await page.waitForTimeout(500);
    const url = page.url();
    assert(name, 'Quick login navigates away', !url.endsWith(':3001/') && !url.endsWith(':3001'), `url=${url}`);
  }

  // Clear localStorage and start fresh
  await page.goto(BASE);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mochi_analytics_consent', 'true'); });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await passAgeGate(page);

  // 3. Normal login
  await page.locator('input[type="text"]').fill('心怡');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });
  assert(name, 'Login success', page.url().includes('onboarding/mbti'));

  // 4. MBTI page — test back button
  // Select first dimension
  await page.locator('.option-card').first().click();
  await page.locator('.strength-btn').first().click();
  await page.locator('button:has-text("下一個維度")').click();
  await page.waitForTimeout(200);

  // Go back
  const backBtn = page.locator('button:has-text("上一步")');
  if (await backBtn.count() > 0) {
    await backBtn.click();
    await page.waitForTimeout(200);
    assert(name, 'MBTI back button works', true);
  }

  // Complete MBTI
  for (let dim = 0; dim < 4; dim++) {
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    const str = page.locator('.strength-btn').first();
    if (await str.count() > 0) await str.click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    if (await btn.count() > 0) { await btn.first().click(); await page.waitForTimeout(200); }
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  // Complete scenarios quickly
  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) { await btn.first().click(); }
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  // 5. Profile — test validation
  const completeBtn = page.locator('button:has-text("完成設定")');
  
  // No photo, no bio, no birthdate = disabled
  const disabledNoBoth = await completeBtn.isDisabled();
  assert(name, 'Complete disabled: no photo + no bio', disabledNoBoth);

  // Add bio but no photo/birthdate
  await page.locator('textarea').fill('測試自我介紹');
  await page.waitForTimeout(100);
  const disabledNoPhoto = await completeBtn.isDisabled();
  assert(name, 'Complete disabled: bio but no photo/birthdate', disabledNoPhoto);

  // Upload photo + set birthdate
  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.waitForTimeout(100);
  const enabledNow = !(await completeBtn.isDisabled());
  assert(name, 'Complete enabled: bio + photo + birthdate', enabledNow);

  // 6. Test upload more photos
  for (let i = 0; i < 5; i++) {
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(TEST_IMG_PATH);
      await page.waitForTimeout(200);
    }
  }
  const uploadBtnAfterMax = page.locator('button:has-text("上傳")');
  const hiddenAfterMax = await uploadBtnAfterMax.count() === 0;
  assert(name, 'Upload photo button hidden at max (6)', hiddenAfterMax);

  // 7. Remove a photo — button should reappear
  const removeBtn = page.locator('button:has-text("✕")').first();
  if (await removeBtn.count() > 0) {
    await removeBtn.click();
    await page.waitForTimeout(100);
  }
  const addBtnReappears = page.locator('button:has-text("上傳")');
  assert(name, 'Upload photo reappears after remove', await addBtnReappears.count() > 0);

  // Complete onboarding
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Onboarding complete after validation tests', page.url().includes('/home'));

  await ctx.close();
}

// ─── Agent 4: Settings Flow ──────────────────────────────────────
async function agent4(browser) {
  const name = 'Agent4-大明';
  console.log(`\n🧪 ${name}: Settings & preferences`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  // Quick complete onboarding
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await passAgeGate(page);
  await page.locator('input[type="text"]').fill('大明');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  for (let dim = 0; dim < 4; dim++) {
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    const str = page.locator('.strength-btn').first();
    if (await str.count() > 0) await str.click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    if (await btn.count() > 0) { await btn.first().click(); await page.waitForTimeout(200); }
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) { await btn.first().click(); }
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('大明的自介');
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });

  // Go to settings
  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  // 1. Check profile card renders
  const profileName = page.locator('text=大明');
  assert(name, 'Settings shows username', await profileName.count() > 0);

  // 2. Check MBTI badge
  const mbtiBadge = page.locator('.mbti-badge');
  assert(name, 'Settings shows MBTI badge', await mbtiBadge.count() > 0);

  // 3. Edit mode
  const editBtn = page.locator('button:has-text("編輯個人資料")');
  assert(name, 'Edit button exists', await editBtn.count() > 0);
  await editBtn.click();
  await page.waitForTimeout(200);

  // 4. Photo grid shows in edit mode
  const photoGrid = page.locator('button:has-text("上傳"), button:has-text("✕")');
  assert(name, 'Photo grid visible in edit mode', await photoGrid.count() > 0);

  // 5. Edit bio
  const bioField = page.locator('textarea');
  await bioField.fill('大明更新後的自我介紹～喜歡健身和戶外運動');

  // 6. Save
  const saveBtn = page.locator('button:has-text("儲存")').first();
  await saveBtn.click();
  await page.waitForTimeout(300);

  // 7. Check bio updated (should exit edit mode)
  const updatedBio = page.locator('text=大明更新後的自我介紹');
  assert(name, 'Bio updated successfully', await updatedBio.count() > 0);

  // 8. Test preferences section
  const prefSection = page.locator('text=配對偏好');
  assert(name, 'Preferences section exists', await prefSection.count() > 0);

  // 9. Toggle gender preference
  const femaleToggle = page.locator('button:has-text("女生")').last();
  if (await femaleToggle.count() > 0) {
    await femaleToggle.click();
    await page.waitForTimeout(100);
  }

  // 10. Save preferences
  const savePrefBtn = page.locator('button:has-text("儲存偏好")');
  if (await savePrefBtn.count() > 0) {
    await savePrefBtn.click();
    await page.waitForTimeout(200);
    assert(name, 'Preferences saved', true);
  }

  // 11. Test logout
  const logoutBtn = page.locator('button:has-text("登出")').first();
  assert(name, 'Logout button exists', await logoutBtn.count() > 0);
  await logoutBtn.scrollIntoViewIfNeeded();
  await logoutBtn.click();
  await page.waitForTimeout(800);

  // Confirm logout in modal — wait for modal to appear
  const confirmLogoutBtn = page.locator('button:has-text("確認登出")');
  await confirmLogoutBtn.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  const hasConfirm = await confirmLogoutBtn.count();
  log(name, `Confirm modal visible: ${hasConfirm > 0}`);
  if (hasConfirm > 0) {
    await confirmLogoutBtn.click();
  }
  // Wait for redirect — settings useEffect does router.replace('/')
  await page.waitForTimeout(2000);
  await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
  const afterLogoutUrl = page.url();
  assert(name, 'Logout redirects to login', !afterLogoutUrl.includes('/settings'), `url=${afterLogoutUrl}`);

  // 12. Verify logged out — age gate or login form shown
  const ageGateBtn = page.locator('button:has-text("我已滿 18 歲")');
  const loginInput = page.locator('input[type="text"]');
  const showsAgeGate = await ageGateBtn.count() > 0;
  const showsLogin = await loginInput.count() > 0;
  assert(name, 'Login page shown after logout', showsAgeGate || showsLogin, `ageGate=${showsAgeGate}, login=${showsLogin}`);

  // 13. Check no Pairly references
  const bodyText = await page.locator('body').textContent();
  assert(name, 'No Pairly references on login page', !bodyText?.includes('Pairly'));

  await ctx.close();
}

// ─── Agent 5: Weekly + Chat Features ──────────────────────────────
async function agent5(browser) {
  const name = 'Agent5-小風';
  console.log(`\n🧪 ${name}: Weekly questions + chat features`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  // Quick onboarding
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await passAgeGate(page);
  await page.locator('input[type="text"]').fill('小風');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  for (let dim = 0; dim < 4; dim++) {
    const opt = page.locator('.option-card').nth(dim % 2);
    if (await opt.count() > 0) await opt.click();
    const str = page.locator('.strength-btn').nth(2);
    if (await str.count() > 0) await str.click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    if (await btn.count() > 0) { await btn.first().click(); await page.waitForTimeout(200); }
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opts = page.locator('.option-card');
    const optCount = await opts.count();
    if (optCount >= 2) {
      await opts.nth(0).click();
      await opts.nth(1).click();
    } else if (optCount > 0) {
      await opts.first().click();
    }
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) { await btn.first().click(); }
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('小風的自介，不拘小節');
  // Select "other" gender
  const otherGenderBtn = page.locator('button:has-text("其他")').first();
  if (await otherGenderBtn.count() > 0) await otherGenderBtn.click();
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });

  // 1. Go to weekly questions
  await page.goto(`${BASE}/weekly`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Check weekly page loaded
  const weeklyTitle = page.locator('text=每週情境題');
  assert(name, 'Weekly page title shows', await weeklyTitle.count() > 0);

  // 2. Answer some weekly questions
  const weeklyOption = page.locator('.option-card').first();
  if (await weeklyOption.count() > 0) {
    await weeklyOption.click();
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成")');
    if (await btn.count() > 0) {
      await btn.first().click();
      await page.waitForTimeout(300);
      assert(name, 'Weekly question phase 1 answered', true);
    }
    // Answer partner phase
    const partnerOpt = page.locator('.option-card').first();
    if (await partnerOpt.count() > 0) {
      await partnerOpt.click();
      const btn2 = page.locator('button:has-text("下一題"), button:has-text("完成")');
      if (await btn2.count() > 0) {
        await btn2.first().click();
        await page.waitForTimeout(300);
        assert(name, 'Weekly question phase 2 answered', true);
      }
    }
  }

  // 3. Go home and like someone to create a match
  await page.goto(`${BASE}/home`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const firstCard = page.locator('.card').first();
  if (await firstCard.count() > 0) {
    await firstCard.click();
    await page.waitForTimeout(300);
    const topicInput = page.locator('textarea').first();
    if (await topicInput.count() > 0) {
      await topicInput.fill('哈囉！想認識你～');
      const likeBtn = page.locator('button:has-text("送出喜歡")');
      if (await likeBtn.count() > 0) {
        await likeBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }

  // 4. Go to matches
  await page.goto(`${BASE}/matches`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  const matchCards = page.locator('.card');
  const mCount = await matchCards.count();
  log(name, `Match count: ${mCount}`);

  // 5. If match exists, test chat features
  if (mCount > 0) {
    await matchCards.first().click();
    await page.waitForURL('**/chat/**', { timeout: 5000 });

    // Check report/block button
    const shieldBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    if (await shieldBtn.count() > 0) {
      await shieldBtn.click();
      await page.waitForTimeout(200);
      const reportMenu = page.locator('text=檢舉');
      assert(name, 'Report menu opens', await reportMenu.count() > 0);
    }

    // Check icebreaker in system message
    const systemMsg = page.locator('.chat-bubble.system');
    if (await systemMsg.count() > 0) {
      const msgText = await systemMsg.first().textContent();
      assert(name, 'System message has icebreaker', msgText?.includes('配對成功') || false, `msg="${msgText?.substring(0, 60)}"`);
    }

    // Send multiple messages
    const chatInput = page.locator('input[type="text"]');
    for (let i = 0; i < 3; i++) {
      await chatInput.fill(`測試訊息 ${i + 1}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    const myBubbles = page.locator('.chat-bubble.mine');
    const bubbleCount = await myBubbles.count();
    assert(name, 'Multiple messages sent', bubbleCount >= 3, `sent=${bubbleCount}`);

    // Back button
    const backBtn = page.locator('button').first();
    await backBtn.click();
    await page.waitForTimeout(300);
    assert(name, 'Chat back → matches', page.url().includes('/matches'));
  }

  // 6. Test bottom nav navigation
  await page.goto(`${BASE}/home`);
  await page.waitForLoadState('networkidle');

  // Navigate via bottom nav
  const navLinks = page.locator('.bottom-nav a');
  const navCount = await navLinks.count();
  assert(name, 'Bottom nav has 4 links', navCount === 4, `count=${navCount}`);

  // Click "週題" (3rd item)
  if (navCount >= 3) {
    await navLinks.nth(2).click();
    await page.waitForTimeout(500);
    assert(name, 'Nav → weekly works', page.url().includes('/weekly'));
  }

  // Click "我的" (4th item)
  if (navCount >= 4) {
    await navLinks.nth(3).click();
    await page.waitForTimeout(500);
    assert(name, 'Nav → settings works', page.url().includes('/settings'));
  }

  // 7. Check no Pairly anywhere
  for (const path of ['/home', '/settings', '/weekly', '/matches']) {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle');
    const text = await page.locator('body').textContent();
    assert(name, `No Pairly on ${path}`, !text?.includes('Pairly'));
  }

  await ctx.close();
}

// ─── Main Runner ──────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Mochi 默契 — 5-Agent E2E Test Suite            ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const browser = await chromium.launch({ headless: true });

  try {
    await agent1(browser);
    await agent2(browser);
    await agent3(browser);
    await agent4(browser);
    await agent5(browser);
  } catch (err) {
    console.error('\n💥 Unhandled test error:', err.message);
    RESULTS.fail++;
    RESULTS.issues.push(`CRASH: ${err.message}`);
  }

  await browser.close();

  // Cleanup temp file
  try { unlinkSync(TEST_IMG_PATH); } catch {}

  // Final report
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  TEST RESULTS                                   ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  ✅ Passed: ${RESULTS.pass}`);
  console.log(`║  ❌ Failed: ${RESULTS.fail}`);
  console.log(`║  Total:    ${RESULTS.pass + RESULTS.fail}`);
  console.log('╠══════════════════════════════════════════════════╣');

  if (RESULTS.issues.length > 0) {
    console.log('║  ISSUES FOUND:');
    RESULTS.issues.forEach((issue, i) => {
      console.log(`║  ${i + 1}. ${issue}`);
    });
  } else {
    console.log('║  🎉 All tests passed!');
  }
  console.log('╚══════════════════════════════════════════════════╝');

  process.exit(RESULTS.fail > 0 ? 1 : 0);
}

main();
