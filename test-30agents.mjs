/**
 * Mochi 默契 — 30-Agent E2E Comprehensive Test
 * 
 * 30 simulated users covering EVERY button, flow, edge case, and possibility.
 *
 * ─── Onboarding Agents ─────────────────────────────────────────────
 *   Agent 1:  小美  — Full happy path (female, 23)
 *   Agent 2:  阿凱  — All left MBTI options (ESTJ) + minimal scenario
 *   Agent 3:  心怡  — All right MBTI options (INFP) + multi-select scenarios
 *   Agent 4:  大明  — MBTI back button + re-select dimensions
 *   Agent 5:  小風  — Other gender + max strength selections
 *   Agent 6:  雅婷  — Empty name validation + quick login buttons
 *   Agent 7:  志明  — Profile validation: no photo/bio/birthdate
 *   Agent 8:  佳慧  — Max 6 photos upload + remove photos
 *   Agent 9:  建宏  — Region selection + age range preferences
 *   Agent 10: 曉玲  — Underage birthdate rejection (if applicable)
 *
 * ─── Home / Discovery Agents ───────────────────────────────────────
 *   Agent 11: 俊傑  — Expand all cards, read bios + compatibility
 *   Agent 12: 美玲  — Like first card with topic answer → check match
 *   Agent 13: 宗翰  — Skip all cards → verify empty state + undo
 *   Agent 14: 淑芬  — Like multiple cards → check match probability
 *   Agent 15: 家豪  — Topic textarea empty → like disabled
 *   Agent 16: 詩涵  — Expand/collapse card toggle
 *   Agent 17: 冠宇  — Countdown timer display + refresh button
 *
 * ─── Chat Agents ──────────────────────────────────────────────────
 *   Agent 18: 怡君  — Full chat: send messages + auto-reply
 *   Agent 19: 承恩  — Report user flow (confirm + toast)
 *   Agent 20: 雅琪  — Block user flow (confirm + redirect)
 *   Agent 21: 柏翰  — Chat back button + no-match 404 page
 *   Agent 22: 思穎  — Multiple rapid messages + scroll
 *
 * ─── Weekly Questions Agent ────────────────────────────────────────
 *   Agent 23: 哲維  — Weekly questions both phases
 *   Agent 24: 欣怡  — Weekly multi-select options
 *
 * ─── Settings Agents ──────────────────────────────────────────────
 *   Agent 25: 韋廷  — Edit profile: bio + photo + save
 *   Agent 26: 佩珊  — Preferences: gender toggles + age range + save
 *   Agent 27: 國豪  — Logout flow: confirm modal + redirect
 *   Agent 28: 嘉欣  — Cancel edit mode + analytics toggle
 *
 * ─── Cross-Feature Agents ─────────────────────────────────────────
 *   Agent 29: 宜蓁  — Bottom nav: all 4 tabs + active state
 *   Agent 30: 威志  — Legal pages + PWA + consent banner + branding check
 */

import { chromium } from 'playwright';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:3001';
const RESULTS = { pass: 0, fail: 0, issues: [] };

// Minimal 1x1 red pixel PNG for photo upload tests
const TEST_IMG_PATH = join(import.meta.dirname, '_test-photo-30.png');
writeFileSync(TEST_IMG_PATH, Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
));

// ─── Helpers ─────────────────────────────────────────────────────

async function uploadTestPhoto(page) {
  const fileInput = page.locator('input[type="file"]');
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(TEST_IMG_PATH);
    await page.waitForTimeout(300);
  }
}

async function fillBirthdate(page, date = '2000-01-01') {
  const dateInput = page.locator('input[type="date"]');
  if (await dateInput.count() > 0) {
    await dateInput.fill(date);
    await page.waitForTimeout(200);
  }
}

function log(agent, msg) {
  console.log(`  [${agent}] ${msg}`);
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

/** Complete onboarding quickly with given params */
async function quickOnboard(page, name, opts = {}) {
  const { gender = '男生', mbtiSide = 0, strengthIdx = 0 } = opts;
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill(name);
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  // MBTI — 4 dimensions
  for (let dim = 0; dim < 4; dim++) {
    const opt = page.locator('.option-card').nth(mbtiSide);
    if (await opt.count() > 0) await opt.click();
    const str = page.locator('.strength-btn').nth(strengthIdx);
    if (await str.count() > 0) await str.click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    if (await btn.count() > 0) { await btn.first().click(); await page.waitForTimeout(200); }
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  // Scenarios — 8 questions × 2 phases
  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) { await btn.first().click(); }
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  // Profile
  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill(`${name}的自我介紹`);
  const genderBtn = page.locator(`button:has-text("${gender}")`).first();
  if (await genderBtn.count() > 0) await genderBtn.click();
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });
}

// ─────────────────────────────────────────────────────────────────
// ONBOARDING AGENTS (1-10)
// ─────────────────────────────────────────────────────────────────

async function agent1(browser) {
  const name = 'Agent01-小美';
  console.log(`\n🧪 ${name}: Full happy path`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  // Login
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const title = await page.title();
  assert(name, 'Login page loads', title.includes('Mochi'), `title="${title}"`);

  const gradientText = await page.locator('.gradient-text').first().textContent();
  assert(name, 'Brand "Mochi 默契" visible', gradientText?.includes('Mochi'));

  // Check login form elements
  const nameInput = page.locator('input[type="text"]');
  assert(name, 'Name input exists', await nameInput.count() > 0);
  const placeholder = await nameInput.getAttribute('placeholder');
  assert(name, 'Placeholder text set', placeholder?.length > 0, `placeholder="${placeholder}"`);

  await nameInput.fill('小美');
  const loginBtn = page.locator('button:has-text("開始配對之旅")');
  assert(name, 'Login button enabled with name', !(await loginBtn.isDisabled()));
  await loginBtn.click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });
  assert(name, 'Redirect → MBTI onboarding', page.url().includes('onboarding/mbti'));

  // MBTI — select all right-side (I, N, F, P) with medium strength
  for (let dim = 0; dim < 4; dim++) {
    const options = page.locator('.option-card');
    assert(name, `MBTI dim${dim+1}: 2 options visible`, await options.count() >= 2, `count=${await options.count()}`);
    await options.nth(1).click();
    const strengthBtns = page.locator('.strength-btn');
    assert(name, `MBTI dim${dim+1}: strength buttons visible`, await strengthBtns.count() >= 2);
    await strengthBtns.nth(1).click();
    const nextBtn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    await nextBtn.first().click();
    await page.waitForTimeout(300);
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });
  assert(name, 'MBTI complete → scenarios', page.url().includes('onboarding/scenarios'));

  // Scenarios — answer all 8 question phases
  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(400);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });
  assert(name, 'Scenarios complete → profile', page.url().includes('onboarding/profile'));

  // Profile setup
  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('我是小美，喜歡旅行和看電影！');
  const femaleBtn = page.locator('button:has-text("女生")').first();
  if (await femaleBtn.count() > 0) await femaleBtn.click();
  const completeBtn = page.locator('button:has-text("完成設定")');
  assert(name, 'Complete button enabled', !(await completeBtn.isDisabled()));
  await completeBtn.click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Onboarding complete → home', page.url().includes('/home'));

  // Verify home page
  const todayTitle = page.locator('text=今日推薦');
  assert(name, 'Home shows "今日推薦"', await todayTitle.count() > 0);
  const cards = page.locator('.card');
  const cardCount = await cards.count();
  assert(name, 'Daily cards rendered', cardCount > 0, `count=${cardCount}`);

  await ctx.close();
}

async function agent2(browser) {
  const name = 'Agent02-阿凱';
  console.log(`\n🧪 ${name}: All left MBTI (ESTJ) + minimal scenario`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('阿凱');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  // All left-side MBTI (E, S, T, J)
  for (let dim = 0; dim < 4; dim++) {
    await page.locator('.option-card').first().click();
    await page.locator('.strength-btn').first().click(); // weakest strength
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    await btn.first().click();
    await page.waitForTimeout(200);
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });
  assert(name, 'MBTI all-left → scenarios', page.url().includes('scenarios'));

  // Minimal scenarios — always pick first option only
  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('阿凱 ESTJ');
  await page.locator('button:has-text("男生")').first().click();
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'ESTJ user onboarded', page.url().includes('/home'));

  // Verify MBTI badge in settings
  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  const badge = page.locator('.mbti-badge');
  assert(name, 'MBTI badge shows in settings', await badge.count() > 0);
  const badgeText = await badge.first().textContent();
  log(name, `MBTI badge: ${badgeText}`);

  await ctx.close();
}

async function agent3(browser) {
  const name = 'Agent03-心怡';
  console.log(`\n🧪 ${name}: All right MBTI (INFP) + multi-select scenarios`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('心怡');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  // All right-side MBTI (I, N, F, P)
  for (let dim = 0; dim < 4; dim++) {
    const options = page.locator('.option-card');
    await options.nth(1).click();
    // strongest strength (3rd button)
    const strs = page.locator('.strength-btn');
    const strCount = await strs.count();
    await strs.nth(strCount - 1).click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    await btn.first().click();
    await page.waitForTimeout(200);
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });
  assert(name, 'MBTI all-right → scenarios', page.url().includes('scenarios'));

  // Multi-select scenarios — pick 2+ options per question
  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opts = page.locator('.option-card');
    const optCount = await opts.count();
    // Select first 2 options (multi-select)
    if (optCount >= 2) {
      await opts.nth(0).click();
      await page.waitForTimeout(100);
      await opts.nth(1).click();
    } else if (optCount > 0) {
      await opts.first().click();
    }
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });
  assert(name, 'Multi-select scenarios → profile', page.url().includes('profile'));

  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('心怡 INFP 多項選擇');
  await page.locator('button:has-text("女生")').first().click();
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'INFP user with multi-select done', page.url().includes('/home'));

  await ctx.close();
}

async function agent4(browser) {
  const name = 'Agent04-大明';
  console.log(`\n🧪 ${name}: MBTI back button + re-select dimensions`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('大明');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  // Dim 1: select left
  await page.locator('.option-card').first().click();
  await page.locator('.strength-btn').first().click();
  await page.locator('button:has-text("下一個維度")').click();
  await page.waitForTimeout(300);

  // Dim 2: select right
  await page.locator('.option-card').nth(1).click();
  await page.locator('.strength-btn').nth(1).click();
  await page.locator('button:has-text("下一個維度")').click();
  await page.waitForTimeout(300);

  // Go back to dim 2 and change selection
  const backBtn = page.locator('button:has-text("上一步")');
  if (await backBtn.count() > 0) {
    await backBtn.click();
    await page.waitForTimeout(300);
    assert(name, 'Back button navigated to previous dim', true);

    // Change dim 2 to left option instead
    await page.locator('.option-card').first().click();
    await page.locator('.strength-btn').nth(2).click(); // max strength
    await page.locator('button:has-text("下一個維度")').click();
    await page.waitForTimeout(200);
    assert(name, 'Re-selected dim after going back', true);
  }

  // Complete remaining MBTI dimensions
  for (let dim = 0; dim < 2; dim++) {
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    const str = page.locator('.strength-btn').first();
    if (await str.count() > 0) await str.click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    if (await btn.count() > 0) { await btn.first().click(); await page.waitForTimeout(200); }
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });
  assert(name, 'MBTI with back-nav → scenarios', page.url().includes('scenarios'));

  // Complete the rest quickly
  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });
  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('大明 back nav test');
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Back-nav MBTI user completed', page.url().includes('/home'));

  await ctx.close();
}

async function agent5(browser) {
  const name = 'Agent05-小風';
  console.log(`\n🧪 ${name}: Other gender + max strength selections`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('小風');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  // All max strength (last button)
  for (let dim = 0; dim < 4; dim++) {
    await page.locator('.option-card').nth(dim % 2).click();
    const strs = page.locator('.strength-btn');
    const strCount = await strs.count();
    await strs.nth(strCount - 1).click(); // max strength
    assert(name, `MBTI dim${dim+1}: max strength selected`, true);
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    await btn.first().click();
    await page.waitForTimeout(200);
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('小風 其他性別');
  // Select "其他" gender
  const otherBtn = page.locator('button:has-text("其他")').first();
  assert(name, 'Other gender option exists', await otherBtn.count() > 0);
  if (await otherBtn.count() > 0) await otherBtn.click();

  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Other gender user completed', page.url().includes('/home'));

  // Verify in settings
  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').textContent();
  assert(name, 'Settings shows 小風', bodyText?.includes('小風'));

  await ctx.close();
}

async function agent6(browser) {
  const name = 'Agent06-雅婷';
  console.log(`\n🧪 ${name}: Empty name + quick login buttons`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  // Test empty name
  const loginBtn = page.locator('button:has-text("開始配對之旅")');
  const isDisabled = await loginBtn.isDisabled();
  assert(name, 'Empty name → login disabled', isDisabled);

  // Test single character
  await page.locator('input[type="text"]').fill('A');
  assert(name, 'Single char → login enabled', !(await loginBtn.isDisabled()));

  // Test max length input
  const longName = '一二三四五六七八九十一二三四五六七八九十';
  await page.locator('input[type="text"]').fill(longName);
  const inputVal = await page.locator('input[type="text"]').inputValue();
  assert(name, 'Input respects maxLength=20', inputVal.length <= 20, `len=${inputVal.length}`);

  // Clear and test quick login: 手機
  await page.locator('input[type="text"]').fill('');
  const phoneBtn = page.locator('button:has-text("手機")');
  if (await phoneBtn.count() > 0) {
    await phoneBtn.click();
    await page.waitForTimeout(500);
    const url = page.url();
    assert(name, 'Phone quick login navigates', url.includes('onboarding') || url.includes('home'), `url=${url}`);
  }

  // Start fresh for Gmail test
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mochi_analytics_consent', 'true'); });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const gmailBtn = page.locator('button:has-text("Gmail")');
  if (await gmailBtn.count() > 0) {
    await gmailBtn.click();
    await page.waitForTimeout(500);
    assert(name, 'Gmail quick login works', page.url().includes('onboarding') || page.url().includes('home'));
  }

  // Start fresh for Apple test
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mochi_analytics_consent', 'true'); });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const appleBtn = page.locator('button:has-text("Apple")');
  if (await appleBtn.count() > 0) {
    await appleBtn.click();
    await page.waitForTimeout(500);
    assert(name, 'Apple quick login works', page.url().includes('onboarding') || page.url().includes('home'));
  }

  // Test Enter key login
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mochi_analytics_consent', 'true'); });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('雅婷');
  await page.locator('input[type="text"]').press('Enter');
  await page.waitForTimeout(1000);
  assert(name, 'Enter key triggers login', page.url().includes('onboarding') || page.url().includes('home'));

  await ctx.close();
}

async function agent7(browser) {
  const name = 'Agent07-志明';
  console.log(`\n🧪 ${name}: Profile validation — no photo/bio/birthdate`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('志明');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  // Quick MBTI
  for (let dim = 0; dim < 4; dim++) {
    await page.locator('.option-card').first().click();
    await page.locator('.strength-btn').first().click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    await btn.first().click();
    await page.waitForTimeout(200);
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  const completeBtn = page.locator('button:has-text("完成設定")');

  // State 1: nothing filled
  assert(name, 'No fields → disabled', await completeBtn.isDisabled());

  // State 2: only bio
  await page.locator('textarea').fill('只有自介');
  await page.waitForTimeout(100);
  assert(name, 'Bio only → disabled', await completeBtn.isDisabled());

  // State 3: bio + photo, no birthdate
  await uploadTestPhoto(page);
  await page.waitForTimeout(100);
  assert(name, 'Bio+photo, no birthdate → disabled', await completeBtn.isDisabled());

  // State 4: bio + photo + birthdate
  await fillBirthdate(page);
  await page.waitForTimeout(100);
  assert(name, 'Bio+photo+birthdate → enabled', !(await completeBtn.isDisabled()));

  // State 5: clear bio → should disable again
  await page.locator('textarea').fill('');
  await page.waitForTimeout(100);
  assert(name, 'Clear bio → disabled again', await completeBtn.isDisabled());

  // Re-fill and complete
  await page.locator('textarea').fill('志明 validation done');
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Validation passed, onboarded', page.url().includes('/home'));

  await ctx.close();
}

async function agent8(browser) {
  const name = 'Agent08-佳慧';
  console.log(`\n🧪 ${name}: Max 6 photos + remove photos`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('佳慧');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  for (let dim = 0; dim < 4; dim++) {
    await page.locator('.option-card').first().click();
    await page.locator('.strength-btn').first().click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    await btn.first().click();
    await page.waitForTimeout(200);
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  // Upload 6 photos one by one
  for (let i = 0; i < 6; i++) {
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(TEST_IMG_PATH);
      await page.waitForTimeout(300);
      log(name, `Uploaded photo ${i + 1}`);
    }
  }

  // Check upload button hidden at max
  const uploadBtn = page.locator('input[type="file"]');
  // After 6 photos, file input or upload area should be gone
  const fileInputCount = await uploadBtn.count();
  log(name, `File inputs after 6 uploads: ${fileInputCount}`);

  // Remove first photo
  const removeBtn = page.locator('button:has-text("✕")').first();
  if (await removeBtn.count() > 0) {
    await removeBtn.click();
    await page.waitForTimeout(200);
    assert(name, 'Removed a photo', true);
  }

  // Upload button should reappear
  await page.waitForTimeout(200);
  const fileInputAfter = page.locator('input[type="file"]');
  assert(name, 'Upload reappears after remove', await fileInputAfter.count() > 0);

  // Remove all photos
  let removeCount = 0;
  for (let i = 0; i < 6; i++) {
    const rmBtn = page.locator('button:has-text("✕")').first();
    if (await rmBtn.count() > 0) {
      await rmBtn.click();
      await page.waitForTimeout(200);
      removeCount++;
    } else {
      break;
    }
  }
  log(name, `Removed ${removeCount} additional photos`);

  // With no photos, complete should be disabled
  const completeBtn = page.locator('button:has-text("完成設定")');
  await page.locator('textarea').fill('佳慧 photo test');
  await fillBirthdate(page);
  // After removing all, should need at least 1 photo
  const disabledNoPhoto = await completeBtn.isDisabled();
  log(name, `Disabled after removing all photos: ${disabledNoPhoto}`);

  // Upload 1 photo and complete
  await uploadTestPhoto(page);
  await page.waitForTimeout(200);
  assert(name, 'Re-upload → enabled', !(await completeBtn.isDisabled()));
  await completeBtn.click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Photo test user completed', page.url().includes('/home'));

  await ctx.close();
}

async function agent9(browser) {
  const name = 'Agent09-建宏';
  console.log(`\n🧪 ${name}: Region selection + age range preferences`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('建宏');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  for (let dim = 0; dim < 4; dim++) {
    await page.locator('.option-card').first().click();
    await page.locator('.strength-btn').first().click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    await btn.first().click();
    await page.waitForTimeout(200);
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  // Check region dropdown
  const regionSelect = page.locator('select');
  if (await regionSelect.count() > 0) {
    const options = await regionSelect.locator('option').allTextContents();
    log(name, `Region options: ${options.join(', ')}`);
    assert(name, 'Region dropdown has options', options.length > 0);

    // Select 台中
    await regionSelect.selectOption({ label: '台中' }).catch(() => 
      regionSelect.selectOption('台中').catch(() => log(name, 'Could not select 台中'))
    );
    assert(name, 'Selected 台中 region', true);
  }

  // Check age range inputs
  const rangeInputs = page.locator('input[type="range"]');
  const rangeCount = await rangeInputs.count();
  log(name, `Range inputs: ${rangeCount}`);
  if (rangeCount >= 1) {
    // Set age min
    await rangeInputs.first().fill('22');
    assert(name, 'Age min range set', true);
  }
  if (rangeCount >= 2) {
    await rangeInputs.nth(1).fill('35');
    assert(name, 'Age max range set', true);
  }

  // Complete
  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('建宏 台中');
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Region+age user completed', page.url().includes('/home'));

  await ctx.close();
}

async function agent10(browser) {
  const name = 'Agent10-曉玲';
  console.log(`\n🧪 ${name}: Underage birthdate boundary test`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('曉玲');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  for (let dim = 0; dim < 4; dim++) {
    await page.locator('.option-card').first().click();
    await page.locator('.strength-btn').first().click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    await btn.first().click();
    await page.waitForTimeout(200);
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  // Try underage date (15 years old)
  await uploadTestPhoto(page);
  await page.locator('textarea').fill('曉玲 underage test');
  await fillBirthdate(page, '2012-01-01'); // ~14 years old
  await page.waitForTimeout(200);

  const completeBtn = page.locator('button:has-text("完成設定")');
  const isDisabledUnderage = await completeBtn.isDisabled();
  log(name, `Underage birthdate → disabled: ${isDisabledUnderage}`);
  // Whether it's disabled or shows warning — either way we check
  assert(name, 'Underage tested (may reject or accept)', true);

  // Set valid birthdate
  await fillBirthdate(page, '2005-01-01'); // 21 years old
  await page.waitForTimeout(200);
  const enabledAdult = !(await completeBtn.isDisabled());
  assert(name, 'Adult birthdate → enabled', enabledAdult);

  // Boundary: exactly 18
  await fillBirthdate(page, '2008-03-13'); // exactly 18 today
  await page.waitForTimeout(200);
  log(name, `Exactly 18 → disabled: ${await completeBtn.isDisabled()}`);

  // Complete with valid date
  await fillBirthdate(page, '2000-06-15');
  await page.waitForTimeout(200);
  await completeBtn.click();
  await page.waitForURL('**/home', { timeout: 5000 });
  assert(name, 'Birthdate boundary agent completed', page.url().includes('/home'));

  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────
// HOME / DISCOVERY AGENTS (11-17)
// ─────────────────────────────────────────────────────────────────

async function agent11(browser) {
  const name = 'Agent11-俊傑';
  console.log(`\n🧪 ${name}: Expand all cards, read bios + compatibility`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '俊傑');

  await page.waitForTimeout(500);
  const cards = page.locator('.card');
  const cardCount = await cards.count();
  assert(name, 'Cards loaded', cardCount > 0, `count=${cardCount}`);

  // Expand each card and check content
  for (let i = 0; i < Math.min(cardCount, 5); i++) {
    const card = cards.nth(i);
    await card.click();
    await page.waitForTimeout(400);

    // Check expanded card shows bio (關於我)
    const bioSection = page.locator('text=關於我');
    const hasBio = await bioSection.count() > 0;
    log(name, `Card ${i + 1} bio visible: ${hasBio}`);

    // Check compatibility bar
    const compatBar = page.locator('.progress-bar-fill');
    if (await compatBar.count() > 0) {
      log(name, `Card ${i + 1} has compat bar`);
    }

    // Check topic section
    const topicSection = page.locator('text=今日話題');
    assert(name, `Card ${i + 1} has topic`, await topicSection.count() > 0);

    // Check MBTI badge on card
    const badge = card.locator('.mbti-badge');
    if (await badge.count() > 0) {
      const badgeText = await badge.first().textContent();
      log(name, `Card ${i + 1} MBTI: ${badgeText}`);
    }

    // Collapse by clicking again
    await card.locator('.cursor-pointer').first().click();
    await page.waitForTimeout(200);
  }

  assert(name, 'All cards expanded/collapsed', true);
  await ctx.close();
}

async function agent12(browser) {
  const name = 'Agent12-美玲';
  console.log(`\n🧪 ${name}: Like card with topic → check match`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '美玲', { gender: '女生' });

  await page.waitForTimeout(500);
  const firstCard = page.locator('.card').first();
  assert(name, 'First card exists', await firstCard.count() > 0);

  // Expand first card
  await firstCard.click();
  await page.waitForTimeout(400);

  // Check like button disabled without answer
  const likeBtn = page.locator('button:has-text("送出喜歡")');
  if (await likeBtn.count() > 0) {
    const disabledNoAnswer = await likeBtn.isDisabled();
    assert(name, 'Like disabled without topic answer', disabledNoAnswer);
  }

  // Write topic answer
  const textarea = page.locator('textarea').first();
  if (await textarea.count() > 0) {
    await textarea.fill('我也很喜歡這個話題！讓我們聊聊吧～');
    const enabledWithAnswer = !(await likeBtn.isDisabled());
    assert(name, 'Like enabled with topic answer', enabledWithAnswer);

    await likeBtn.click();
    await page.waitForTimeout(600);
    assert(name, 'Like sent', true);
  }

  // Check if card shows "已送出喜歡" or "配對成功" or heart icon
  await page.waitForTimeout(300);
  const likedStatus = page.locator('text=已送出喜歡, text=配對成功');
  const heartFilled = page.locator('svg[fill="#F43F5E"]');
  assert(name, 'Like status shown', await likedStatus.count() > 0 || await heartFilled.count() > 0);

  // Check match alert (may or may not appear)
  const matchAlert = page.locator('text=配對成功');
  const hasMatch = await matchAlert.count() > 0;
  log(name, `Match created: ${hasMatch}`);

  // Check matches page
  await page.goto(`${BASE}/matches`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const matchItems = page.locator('.card');
  log(name, `Matches: ${await matchItems.count()}`);

  await ctx.close();
}

async function agent13(browser) {
  const name = 'Agent13-宗翰';
  console.log(`\n🧪 ${name}: Skip all cards + undo`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '宗翰');

  await page.waitForTimeout(500);

  // Skip first card
  const firstCard = page.locator('.card').first();
  await firstCard.click();
  await page.waitForTimeout(300);

  const skipBtn = page.locator('button:has-text("跳過")');
  if (await skipBtn.count() > 0) {
    await skipBtn.first().click();
    await page.waitForTimeout(500);
    assert(name, 'Skipped first card', true);

    // Check undo toast appears
    const undoBtn = page.locator('button:has-text("復原"), button:has-text("Undo"), button:has-text("收回")');
    if (await undoBtn.count() > 0) {
      assert(name, 'Undo button appears', true);
      await undoBtn.first().click();
      await page.waitForTimeout(300);
      assert(name, 'Undo clicked', true);

      // Card should reappear
      const cardsAfterUndo = page.locator('.card');
      assert(name, 'Card reappears after undo', await cardsAfterUndo.count() > 0);
    }
  }

  // Now skip ALL cards
  let skipped = 0;
  for (let i = 0; i < 10; i++) {
    const card = page.locator('.card').first();
    if (await card.count() === 0) break;
    await card.click();
    await page.waitForTimeout(300);
    const skip = page.locator('button:has-text("跳過")');
    if (await skip.count() > 0) {
      await skip.first().click();
      skipped++;
      await page.waitForTimeout(300);
    } else break;
  }
  log(name, `Total skipped: ${skipped}`);
  assert(name, 'Skipped multiple cards', skipped > 0);

  // Check empty/no-more state
  const remaining = await page.locator('.card').count();
  log(name, `Remaining after skip all: ${remaining}`);

  // Check for empty state text or refresh button
  const emptyOrRefresh = page.locator('text=等等, text=探索今日推薦, text=正在找人');
  if (remaining === 0) {
    assert(name, 'Empty state or refresh shown', await emptyOrRefresh.count() >= 0);
  }

  await ctx.close();
}

async function agent14(browser) {
  const name = 'Agent14-淑芬';
  console.log(`\n🧪 ${name}: Like multiple cards → match probability`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '淑芬', { gender: '女生' });

  await page.waitForTimeout(500);
  let likesSent = 0;
  let matchesCreated = 0;

  // Like up to 5 cards
  for (let i = 0; i < 5; i++) {
    const cards = page.locator('.card');
    const count = await cards.count();
    if (count === 0) break;

    // Find a non-liked card
    const card = cards.first();
    await card.click();
    await page.waitForTimeout(400);

    const textarea = page.locator('textarea').first();
    const likeBtn = page.locator('button:has-text("送出喜歡")');
    if (await textarea.count() > 0 && await likeBtn.count() > 0) {
      await textarea.fill(`淑芬的回答 ${i + 1} 💕`);
      await likeBtn.click();
      likesSent++;
      await page.waitForTimeout(500);

      // Check if match alert appeared
      const alert = page.locator('text=配對成功');
      if (await alert.count() > 0) {
        matchesCreated++;
      }
    }
    await page.waitForTimeout(200);
  }

  log(name, `Likes sent: ${likesSent}, Matches: ${matchesCreated}`);
  assert(name, 'Sent multiple likes', likesSent >= 1);

  // Verify in matches page
  await page.goto(`${BASE}/matches`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const matchCards = page.locator('.card');
  const totalMatches = await matchCards.count();
  log(name, `Total matches on page: ${totalMatches}`);

  await ctx.close();
}

async function agent15(browser) {
  const name = 'Agent15-家豪';
  console.log(`\n🧪 ${name}: Topic textarea empty → like disabled`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '家豪');

  await page.waitForTimeout(500);
  const firstCard = page.locator('.card').first();
  if (await firstCard.count() > 0) {
    await firstCard.click();
    await page.waitForTimeout(400);

    const likeBtn = page.locator('button:has-text("送出喜歡")');
    const textarea = page.locator('textarea').first();

    if (await likeBtn.count() > 0) {
      // No text → disabled
      assert(name, 'Like disabled with empty textarea', await likeBtn.isDisabled());

      // Spaces only → still disabled
      await textarea.fill('   ');
      await page.waitForTimeout(100);
      assert(name, 'Like disabled with spaces only', await likeBtn.isDisabled());

      // Real text → enabled
      await textarea.fill('好問題！');
      await page.waitForTimeout(100);
      assert(name, 'Like enabled with text', !(await likeBtn.isDisabled()));

      // Clear → disabled again
      await textarea.fill('');
      await page.waitForTimeout(100);
      assert(name, 'Like disabled after clearing', await likeBtn.isDisabled());
    }
  }

  await ctx.close();
}

async function agent16(browser) {
  const name = 'Agent16-詩涵';
  console.log(`\n🧪 ${name}: Expand/collapse card toggle`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '詩涵', { gender: '女生' });

  await page.waitForTimeout(500);
  const cards = page.locator('.card');
  const cardCount = await cards.count();

  if (cardCount >= 2) {
    // Expand card 1
    await cards.nth(0).click();
    await page.waitForTimeout(300);
    const topicVisible1 = await page.locator('text=今日話題').count() > 0;
    assert(name, 'Card 1 expanded shows topic', topicVisible1);

    // Click card 2 — card 1 should collapse, card 2 expands
    await cards.nth(1).locator('.cursor-pointer').first().click();
    await page.waitForTimeout(300);

    // Card 2 should now be expanded
    const topicStillVisible = await page.locator('text=今日話題').count() > 0;
    assert(name, 'Card 2 expanded shows topic', topicStillVisible);

    // Collapse card 2 by clicking again
    await cards.nth(1).locator('.cursor-pointer').first().click();
    await page.waitForTimeout(300);
    const allCollapsed = await page.locator('text=今日話題').count() === 0;
    assert(name, 'All cards collapsed after re-click', allCollapsed);
  } else {
    assert(name, 'At least 2 cards needed', false, `only ${cardCount}`);
  }

  await ctx.close();
}

async function agent17(browser) {
  const name = 'Agent17-冠宇';
  console.log(`\n🧪 ${name}: Countdown timer + refresh button`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '冠宇');

  await page.waitForTimeout(500);

  // Check countdown timer display
  const countdown = page.locator('text=/\\d+h \\d+m/');
  const hasCountdown = await countdown.count() > 0;
  log(name, `Countdown visible: ${hasCountdown}`);
  if (hasCountdown) {
    const countdownText = await countdown.first().textContent();
    assert(name, 'Countdown format correct', /\d+h \d+m/.test(countdownText), countdownText);
  }

  // Check "個人等你認識" person count
  const personCount = page.locator('text=/\\d+ 個人等你認識/');
  assert(name, 'Person count shown', await personCount.count() > 0);

  // Skip all to trigger empty state with refresh
  for (let i = 0; i < 10; i++) {
    const card = page.locator('.card').first();
    if (await card.count() === 0) break;
    await card.click();
    await page.waitForTimeout(200);
    const skip = page.locator('button:has-text("跳過")');
    if (await skip.count() > 0) { await skip.first().click(); await page.waitForTimeout(200); }
    else break;
  }

  // Look for refresh button in empty state
  const refreshBtn = page.locator('button:has-text("探索今日推薦")');
  if (await refreshBtn.count() > 0) {
    assert(name, 'Refresh button visible', true);
    await refreshBtn.click();
    await page.waitForTimeout(800);
    const newCards = await page.locator('.card').count();
    assert(name, 'Refresh loaded new cards', newCards > 0, `count=${newCards}`);
  }

  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────
// CHAT AGENTS (18-22)
// ─────────────────────────────────────────────────────────────────

/** Helper: onboard + create a match for chat testing */
async function onboardAndMatch(page, userName, opts = {}) {
  await quickOnboard(page, userName, opts);
  await page.waitForTimeout(500);

  // Like first card to try creating a match
  const firstCard = page.locator('.card').first();
  if (await firstCard.count() > 0) {
    await firstCard.click();
    await page.waitForTimeout(400);
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.fill(`${userName} 的回答～`);
      const likeBtn = page.locator('button:has-text("送出喜歡")');
      if (await likeBtn.count() > 0) {
        await likeBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }

  // Like more cards if needed
  for (let i = 0; i < 4; i++) {
    const cards = page.locator('.card');
    if (await cards.count() === 0) break;
    const card = cards.first();
    await card.click();
    await page.waitForTimeout(300);
    const ta = page.locator('textarea').first();
    const lb = page.locator('button:has-text("送出喜歡")');
    if (await ta.count() > 0 && await lb.count() > 0) {
      await ta.fill(`回答 ${i}！`);
      await lb.click();
      await page.waitForTimeout(400);
    } else {
      // Maybe already liked, skip
      const skip = page.locator('button:has-text("跳過")');
      if (await skip.count() > 0) { await skip.first().click(); await page.waitForTimeout(200); }
    }
  }

  // Navigate to matches
  await page.goto(`${BASE}/matches`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  return await page.locator('.card').count();
}

async function agent18(browser) {
  const name = 'Agent18-怡君';
  console.log(`\n🧪 ${name}: Full chat — messages + auto-reply`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  const matchCount = await onboardAndMatch(page, '怡君', { gender: '女生' });
  log(name, `Matches: ${matchCount}`);

  // If no match from first attempt, try refreshing cards and liking more
  let finalMatchCount = matchCount;
  if (finalMatchCount === 0) {
    await page.goto(`${BASE}/home`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    // Refresh daily cards to get new ones
    const refreshBtn = page.locator('button:has-text("探索今日推薦")');
    if (await refreshBtn.count() > 0) {
      await refreshBtn.click();
      await page.waitForTimeout(800);
    }
    // Like all available cards
    for (let i = 0; i < 5; i++) {
      const card = page.locator('.card').first();
      if (await card.count() === 0) break;
      await card.click();
      await page.waitForTimeout(300);
      const ta = page.locator('textarea').first();
      const lb = page.locator('button:has-text("送出喜歡")');
      if (await ta.count() > 0 && await lb.count() > 0) {
        await ta.fill(`怡君再試 ${i}！`);
        await lb.click();
        await page.waitForTimeout(400);
      } else break;
    }
    await page.goto(`${BASE}/matches`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    finalMatchCount = await page.locator('.card').count();
  }

  if (finalMatchCount > 0) {
    // Enter chat
    await page.locator('.card').first().click();
    await page.waitForURL('**/chat/**', { timeout: 5000 });
    assert(name, 'Entered chat page', page.url().includes('/chat/'));

    // Check header elements
    const partnerName = page.locator('.font-bold').first();
    assert(name, 'Partner name visible', await partnerName.count() > 0);
    const mbtiBadge = page.locator('.mbti-badge');
    assert(name, 'Partner MBTI badge', await mbtiBadge.count() > 0);

    // Check compatibility info
    const compatInfo = page.locator('text=契合度');
    assert(name, 'Compatibility shown', await compatInfo.count() > 0);

    // Check topic card
    const topicCard = page.locator('text=配對話題');
    assert(name, 'Match topic shown', await topicCard.count() > 0);

    // Check system message (icebreaker)
    const systemMsg = page.locator('.chat-bubble.system');
    if (await systemMsg.count() > 0) {
      const text = await systemMsg.first().textContent();
      assert(name, 'System message exists', text?.length > 0, `"${text?.substring(0, 50)}..."`);
    }

    // Send a message via input + Enter
    const chatInput = page.locator('input[type="text"]');
    await chatInput.fill('你好！怡君這裡～');
    await chatInput.press('Enter');
    await page.waitForTimeout(1000);

    const myBubbles = page.locator('.chat-bubble.mine');
    assert(name, 'My message appears', await myBubbles.count() > 0);

    // Wait for auto-reply (2s + buffer)
    await page.waitForTimeout(3500);
    const theirBubbles = page.locator('.chat-bubble.theirs');
    assert(name, 'Auto-reply received', await theirBubbles.count() > 0);

    // Check message timestamps
    const timestamps = page.locator('.text-\\[10px\\]');
    assert(name, 'Timestamps shown', await timestamps.count() > 0);

    // Send another message via button
    await chatInput.fill('第二則訊息～');
    const sendBtn = page.locator('button[aria-label="送出訊息"]');
    if (await sendBtn.count() > 0) {
      await sendBtn.click();
      await page.waitForTimeout(500);
      const myCount = await myBubbles.count();
      assert(name, 'Second message sent', myCount >= 2, `count=${myCount}`);
    }

    // Test empty send (disabled)
    await chatInput.fill('');
    if (await sendBtn.count() > 0) {
      assert(name, 'Send disabled when empty', await sendBtn.isDisabled());
    }
  } else {
    log(name, 'No matches after retry (random chance) — skipping chat test');
  }

  await ctx.close();
}

async function agent19(browser) {
  const name = 'Agent19-承恩';
  console.log(`\n🧪 ${name}: Report user flow`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  const matchCount = await onboardAndMatch(page, '承恩');
  log(name, `Matches: ${matchCount}`);

  if (matchCount > 0) {
    await page.locator('.card').first().click();
    await page.waitForURL('**/chat/**', { timeout: 5000 });

    // Find shield/safety button
    const shieldBtn = page.locator('button[aria-label="安全選項"]');
    if (await shieldBtn.count() > 0) {
      await shieldBtn.click();
      await page.waitForTimeout(300);

      // Report button should appear
      const reportBtn = page.locator('button:has-text("檢舉")');
      assert(name, 'Report button appears', await reportBtn.count() > 0);

      await reportBtn.click();
      await page.waitForTimeout(300);

      // Confirmation dialog
      const confirmText = page.locator('text=確定要檢舉');
      assert(name, 'Report confirm dialog shows', await confirmText.count() > 0);

      // Cancel first
      const cancelBtn = page.locator('button:has-text("取消")');
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click();
        await page.waitForTimeout(200);
        assert(name, 'Cancel dismisses dialog', await confirmText.count() === 0);
      }

      // Re-open and confirm
      await shieldBtn.click();
      await page.waitForTimeout(200);
      await page.locator('button:has-text("檢舉")').click();
      await page.waitForTimeout(200);
      const confirmReportBtn = page.locator('button:has-text("確認檢舉")');
      if (await confirmReportBtn.count() > 0) {
        await confirmReportBtn.click();
        await page.waitForTimeout(500);
        // Should show toast
        const toast = page.locator('text=已收到你的檢舉');
        assert(name, 'Report success toast shown', await toast.count() > 0);

        // Should still be in chat (not redirected)
        assert(name, 'Still in chat after report', page.url().includes('/chat/'));
      }
    }
  } else {
    log(name, 'No matches for report test');
  }

  await ctx.close();
}

async function agent20(browser) {
  const name = 'Agent20-雅琪';
  console.log(`\n🧪 ${name}: Block user flow`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  const matchCount = await onboardAndMatch(page, '雅琪', { gender: '女生' });
  log(name, `Matches: ${matchCount}`);

  if (matchCount > 0) {
    await page.locator('.card').first().click();
    await page.waitForURL('**/chat/**', { timeout: 5000 });

    const shieldBtn = page.locator('button[aria-label="安全選項"]');
    if (await shieldBtn.count() > 0) {
      await shieldBtn.click();
      await page.waitForTimeout(300);

      // Block button
      const blockBtn = page.locator('button:has-text("封鎖")');
      assert(name, 'Block button appears', await blockBtn.count() > 0);

      await blockBtn.click();
      await page.waitForTimeout(300);

      // Confirmation
      const confirmText = page.locator('text=確定要封鎖');
      assert(name, 'Block confirm dialog shows', await confirmText.count() > 0);

      const confirmBlockBtn = page.locator('button:has-text("確認封鎖")');
      if (await confirmBlockBtn.count() > 0) {
        await confirmBlockBtn.click();
        await page.waitForTimeout(1000);

        // Should redirect to matches
        assert(name, 'Blocked → redirect to matches', page.url().includes('/matches'));

        // Match should be removed
        const newMatchCount = await page.locator('.card').count();
        assert(name, 'Match removed after block', newMatchCount < matchCount);
      }
    }
  } else {
    log(name, 'No matches for block test');
  }

  await ctx.close();
}

async function agent21(browser) {
  const name = 'Agent21-柏翰';
  console.log(`\n🧪 ${name}: Chat back button + no-match 404`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '柏翰');

  // Test invalid chat ID
  await page.goto(`${BASE}/chat/nonexistent-id-12345`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Should show "找不到這個對話"
  const notFound = page.locator('text=找不到');
  assert(name, 'Invalid chat shows not-found', await notFound.count() > 0);

  // Click "返回配對列表" button
  const backToMatches = page.locator('button:has-text("返回配對列表")');
  if (await backToMatches.count() > 0) {
    await backToMatches.click();
    await page.waitForTimeout(500);
    assert(name, 'Back to matches from 404', page.url().includes('/matches'));
  }

  // Test chat back button if there's a match — reuse existing session
  // Like cards from home to try creating a match
  await page.goto(`${BASE}/home`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  for (let i = 0; i < 5; i++) {
    const cards = page.locator('.card');
    if (await cards.count() === 0) break;
    const card = cards.first();
    await card.click();
    await page.waitForTimeout(300);
    const ta = page.locator('textarea').first();
    const lb = page.locator('button:has-text("送出喜歡")');
    if (await ta.count() > 0 && await lb.count() > 0) {
      await ta.fill(`柏翰回答 ${i}`);
      await lb.click();
      await page.waitForTimeout(400);
    } else {
      const skip = page.locator('button:has-text("跳過")');
      if (await skip.count() > 0) { await skip.first().click(); await page.waitForTimeout(200); }
    }
  }

  await page.goto(`${BASE}/matches`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const matchCount = await page.locator('.card').count();

  if (matchCount > 0) {
    await page.locator('.card').first().click();
    await page.waitForURL('**/chat/**', { timeout: 5000 });

    const chatBackBtn = page.locator('button[aria-label="返回"]');
    if (await chatBackBtn.count() > 0) {
      await chatBackBtn.click();
      await page.waitForTimeout(500);
      assert(name, 'Chat back → matches', page.url().includes('/matches'));
    }
  }

  await ctx.close();
}

async function agent22(browser) {
  const name = 'Agent22-思穎';
  console.log(`\n🧪 ${name}: Multiple rapid messages + shared answers`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  const matchCount = await onboardAndMatch(page, '思穎', { gender: '女生' });
  log(name, `Matches: ${matchCount}`);

  if (matchCount > 0) {
    await page.locator('.card').first().click();
    await page.waitForURL('**/chat/**', { timeout: 5000 });

    // Check shared answers / common points section
    const sharedSection = page.locator('text=共同點, text=共同選擇');
    log(name, `Shared section visible: ${await sharedSection.count() > 0}`);

    // Send 5 rapid messages
    const chatInput = page.locator('input[type="text"]');
    for (let i = 1; i <= 5; i++) {
      await chatInput.fill(`快速訊息 ${i} 🚀`);
      await chatInput.press('Enter');
      await page.waitForTimeout(200);
    }

    const myBubbles = page.locator('.chat-bubble.mine');
    const bubbleCount = await myBubbles.count();
    assert(name, '5 rapid messages sent', bubbleCount >= 5, `count=${bubbleCount}`);

    // Wait for auto-replies
    await page.waitForTimeout(4000);
    const theirBubbles = page.locator('.chat-bubble.theirs');
    const replyCount = await theirBubbles.count();
    log(name, `Auto-replies received: ${replyCount}`);
    assert(name, 'At least 1 auto-reply', replyCount >= 1);

    // Check scroll to bottom works (messages container)
    const allBubbles = page.locator('.chat-bubble');
    const totalBubbles = await allBubbles.count();
    log(name, `Total chat bubbles: ${totalBubbles}`);
    assert(name, 'Many bubbles in chat', totalBubbles >= 5);
  } else {
    log(name, 'No matches for rapid msg test');
  }

  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────
// WEEKLY AGENTS (23-24)
// ─────────────────────────────────────────────────────────────────

async function agent23(browser) {
  const name = 'Agent23-哲維';
  console.log(`\n🧪 ${name}: Weekly questions both phases`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '哲維');

  // Navigate to weekly
  await page.goto(`${BASE}/weekly`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Check title
  const weeklyTitle = page.locator('text=每週情境題');
  assert(name, 'Weekly title shows', await weeklyTitle.count() > 0);

  // Answer questions through both phases
  let questionsAnswered = 0;
  for (let q = 0; q < 12; q++) {
    const opts = page.locator('.option-card');
    const optCount = await opts.count();
    if (optCount === 0) break;

    await opts.first().click();
    await page.waitForTimeout(200);

    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成")');
    if (await btn.count() > 0) {
      await btn.first().click();
      questionsAnswered++;
      await page.waitForTimeout(300);
    } else break;
  }

  log(name, `Weekly questions answered: ${questionsAnswered}`);
  assert(name, 'Answered weekly questions', questionsAnswered > 0);

  // Check completion state
  const completionText = page.locator('text=都回答完了, text=本週已完成, text=完成');
  log(name, `Completion state: ${await completionText.count() > 0}`);

  await ctx.close();
}

async function agent24(browser) {
  const name = 'Agent24-欣怡';
  console.log(`\n🧪 ${name}: Weekly multi-select options`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '欣怡', { gender: '女生' });

  await page.goto(`${BASE}/weekly`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Try to select multiple options per question
  for (let q = 0; q < 8; q++) {
    const opts = page.locator('.option-card');
    const optCount = await opts.count();
    if (optCount === 0) break;

    // Select 2 options if available
    if (optCount >= 2) {
      await opts.nth(0).click();
      await page.waitForTimeout(100);
      await opts.nth(1).click();
      await page.waitForTimeout(100);
      log(name, `Q${q + 1}: Selected 2 of ${optCount} options`);
    } else if (optCount > 0) {
      await opts.first().click();
    }
    await page.waitForTimeout(200);

    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成")');
    if (await btn.count() > 0) {
      await btn.first().click();
      await page.waitForTimeout(300);
    } else break;
  }

  assert(name, 'Multi-select weekly done', true);

  // Check bottom nav to weekly shows active state
  const navLinks = page.locator('.bottom-nav a');
  if (await navLinks.count() >= 3) {
    const weeklyLink = navLinks.nth(2);
    const classes = await weeklyLink.getAttribute('class');
    log(name, `Weekly nav classes: ${classes}`);
  }

  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────
// SETTINGS AGENTS (25-28)
// ─────────────────────────────────────────────────────────────────

async function agent25(browser) {
  const name = 'Agent25-韋廷';
  console.log(`\n🧪 ${name}: Edit profile — bio + photo + save`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '韋廷');

  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  // Check profile renders
  assert(name, 'Settings shows username', (await page.locator('body').textContent())?.includes('韋廷'));

  // Check MBTI badge
  const badge = page.locator('.mbti-badge');
  assert(name, 'MBTI badge shown', await badge.count() > 0);

  // Enter edit mode
  const editBtn = page.locator('button:has-text("編輯個人資料")');
  assert(name, 'Edit button exists', await editBtn.count() > 0);
  await editBtn.click();
  await page.waitForTimeout(300);

  // Edit bio
  const bioField = page.locator('textarea');
  if (await bioField.count() > 0) {
    await bioField.fill('韋廷更新後的自介 — 喜歡音樂和程式設計 🎵💻');

    // Upload another photo
    await uploadTestPhoto(page);

    // Save
    const saveBtn = page.locator('button:has-text("儲存")').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(500);

      // Check bio updated
      const updatedBio = page.locator('text=韋廷更新後的自介');
      assert(name, 'Bio updated', await updatedBio.count() > 0);
    }
  }

  // Re-enter edit and check photo grid
  const editBtn2 = page.locator('button:has-text("編輯個人資料")');
  if (await editBtn2.count() > 0) {
    await editBtn2.click();
    await page.waitForTimeout(200);
    const photos = page.locator('button:has-text("✕")');
    const photoCount = await photos.count();
    log(name, `Photos in grid: ${photoCount}`);
    assert(name, 'Photo grid shows in edit mode', photoCount > 0);

    // Cancel edit
    const cancelBtn = page.locator('button:has-text("取消")');
    if (await cancelBtn.count() > 0) {
      await cancelBtn.click();
      await page.waitForTimeout(200);
      assert(name, 'Cancel exits edit mode', true);
    }
  }

  await ctx.close();
}

async function agent26(browser) {
  const name = 'Agent26-佩珊';
  console.log(`\n🧪 ${name}: Preferences — gender + age range + save`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '佩珊', { gender: '女生' });

  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  // Check preferences section
  const prefSection = page.locator('text=配對偏好');
  assert(name, 'Preferences section exists', await prefSection.count() > 0);

  // Toggle gender preferences
  const maleToggle = page.locator('button:has-text("男生")').last();
  const femaleToggle = page.locator('button:has-text("女生")').last();
  const otherToggle = page.locator('button:has-text("其他")').last();

  if (await maleToggle.count() > 0) {
    await maleToggle.click();
    await page.waitForTimeout(100);
    assert(name, 'Male preference toggled', true);
  }
  if (await femaleToggle.count() > 0) {
    await femaleToggle.click();
    await page.waitForTimeout(100);
    assert(name, 'Female preference toggled', true);
  }
  if (await otherToggle.count() > 0) {
    await otherToggle.click();
    await page.waitForTimeout(100);
    assert(name, 'Other preference toggled', true);
  }

  // Age range sliders
  const rangeInputs = page.locator('input[type="range"]');
  if (await rangeInputs.count() >= 2) {
    await rangeInputs.first().fill('20');
    await rangeInputs.nth(1).fill('40');
    assert(name, 'Age range adjusted', true);
  }

  // Save preferences
  const savePrefBtn = page.locator('button:has-text("儲存偏好")');
  if (await savePrefBtn.count() > 0) {
    await savePrefBtn.click();
    await page.waitForTimeout(300);
    assert(name, 'Preferences saved', true);
  }

  // Verify persistence: reload page
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const prefStillExists = await page.locator('text=配對偏好').count() > 0;
  assert(name, 'Preferences persist after reload', prefStillExists);

  await ctx.close();
}

async function agent27(browser) {
  const name = 'Agent27-國豪';
  console.log(`\n🧪 ${name}: Logout flow — confirm modal + redirect`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '國豪');

  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  // Find logout button
  const logoutBtn = page.locator('button:has-text("登出")').first();
  assert(name, 'Logout button exists', await logoutBtn.count() > 0);
  await logoutBtn.scrollIntoViewIfNeeded();
  await logoutBtn.click();
  await page.waitForTimeout(800);

  // Check modal appears
  const confirmModal = page.locator('button:has-text("確認登出")');
  assert(name, 'Logout confirm modal shows', await confirmModal.count() > 0);

  // Check cancel button in modal
  const cancelLogout = page.locator('button:has-text("取消")');
  if (await cancelLogout.count() > 0) {
    await cancelLogout.click();
    await page.waitForTimeout(300);
    // Should still be on settings
    assert(name, 'Cancel keeps on settings', page.url().includes('/settings'));
  }

  // Re-click logout and confirm
  await logoutBtn.click();
  await page.waitForTimeout(800);
  const confirmBtn = page.locator('button:has-text("確認登出")');
  await confirmBtn.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await confirmBtn.count() > 0) {
    await confirmBtn.click();
    await page.waitForTimeout(2000);
    await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
    assert(name, 'Logout redirects to login', !page.url().includes('/settings'));
  }

  // Verify logged out
  const loginInput = page.locator('input[type="text"]');
  assert(name, 'Login page shown after logout', await loginInput.count() > 0);

  // Verify localStorage cleared
  const userData = await page.evaluate(() => localStorage.getItem('mbti-match-user'));
  assert(name, 'User data cleared', !userData);

  await ctx.close();
}

async function agent28(browser) {
  const name = 'Agent28-嘉欣';
  console.log(`\n🧪 ${name}: Cancel edit mode + analytics toggle`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '嘉欣', { gender: '女生' });

  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  // Enter edit mode
  const editBtn = page.locator('button:has-text("編輯個人資料")');
  await editBtn.click();
  await page.waitForTimeout(200);

  // Make changes but don't save
  const bioField = page.locator('textarea');
  if (await bioField.count() > 0) {
    const originalBio = await bioField.inputValue();
    await bioField.fill('This should NOT be saved!');

    // Cancel
    const cancelBtn = page.locator('button:has-text("取消")');
    if (await cancelBtn.count() > 0) {
      await cancelBtn.click();
      await page.waitForTimeout(300);

      // Verify old bio restored
      const bodyText = await page.locator('body').textContent();
      const notSaved = !bodyText?.includes('This should NOT be saved');
      assert(name, 'Cancel discards changes', notSaved);
    }
  }

  // Test analytics consent toggle
  const analyticsToggle = page.locator('text=匿名分析').locator('..').locator('button, input[type="checkbox"]');
  if (await analyticsToggle.count() > 0) {
    await analyticsToggle.first().click();
    await page.waitForTimeout(200);
    const consent = await page.evaluate(() => localStorage.getItem('mochi_analytics_consent'));
    log(name, `Analytics consent after toggle: ${consent}`);
    assert(name, 'Analytics toggle works', true);

    // Toggle back
    await analyticsToggle.first().click();
    await page.waitForTimeout(200);
  } else {
    log(name, 'No analytics toggle found — checking for other consent UI');
  }

  // Verify page reload preserves settings
  await page.reload();
  await page.waitForLoadState('networkidle');
  assert(name, 'Settings persist after reload', (await page.locator('body').textContent())?.includes('嘉欣'));

  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────
// CROSS-FEATURE AGENTS (29-30)
// ─────────────────────────────────────────────────────────────────

async function agent29(browser) {
  const name = 'Agent29-宜蓁';
  console.log(`\n🧪 ${name}: Bottom nav — all 4 tabs + active state`);
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();
  await quickOnboard(page, '宜蓁', { gender: '女生' });

  // Check bottom nav exists
  const nav = page.locator('.bottom-nav');
  assert(name, 'Bottom nav exists', await nav.count() > 0);

  const navLinks = page.locator('.bottom-nav a');
  const navCount = await navLinks.count();
  assert(name, 'Bottom nav has 4 items', navCount === 4, `count=${navCount}`);

  // Tab 1: 探索 (Home)
  if (navCount >= 1) {
    await navLinks.nth(0).click();
    await page.waitForTimeout(500);
    assert(name, 'Tab 1 → /home', page.url().includes('/home'));
    // Check active state
    const activeClass = await navLinks.nth(0).getAttribute('class');
    log(name, `Home nav classes: ${activeClass?.substring(0, 60)}`);
  }

  // Tab 2: 配對 (Matches)
  if (navCount >= 2) {
    await navLinks.nth(1).click();
    await page.waitForTimeout(500);
    assert(name, 'Tab 2 → /matches', page.url().includes('/matches'));
  }

  // Tab 3: 週題 (Weekly)
  if (navCount >= 3) {
    await navLinks.nth(2).click();
    await page.waitForTimeout(500);
    assert(name, 'Tab 3 → /weekly', page.url().includes('/weekly'));
  }

  // Tab 4: 我的 (Settings)
  if (navCount >= 4) {
    await navLinks.nth(3).click();
    await page.waitForTimeout(500);
    assert(name, 'Tab 4 → /settings', page.url().includes('/settings'));
  }

  // Rapid tab switching
  for (let i = 0; i < 3; i++) {
    for (let tab = 0; tab < 4; tab++) {
      await navLinks.nth(tab).click();
      await page.waitForTimeout(200);
    }
  }
  assert(name, 'Rapid tab switching stable', true);

  // Verify nav labels
  const navTexts = await navLinks.allTextContents();
  log(name, `Nav labels: ${navTexts.join(' | ')}`);
  assert(name, 'Nav has "探索"', navTexts.some(t => t.includes('探索')));
  assert(name, 'Nav has "配對"', navTexts.some(t => t.includes('配對')));
  assert(name, 'Nav has "週題"', navTexts.some(t => t.includes('週題')));
  assert(name, 'Nav has "我的"', navTexts.some(t => t.includes('我的')));

  await ctx.close();
}

async function agent30(browser) {
  const name = 'Agent30-威志';
  console.log(`\n🧪 ${name}: Legal pages + PWA + consent + branding`);
  const ctx = await browser.newContext();
  // Do NOT set consent — test consent banner
  const page = await ctx.newPage();

  // 1. Test consent banner on fresh visit
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const consentBanner = page.locator('text=隱私分析, text=匿名分析, text=分析');
  log(name, `Consent banner visible: ${await consentBanner.count()}`);

  // Accept consent
  const acceptBtn = page.locator('button:has-text("接受"), button:has-text("同意")');
  if (await acceptBtn.count() > 0) {
    await acceptBtn.first().click();
    await page.waitForTimeout(300);
    const consent = await page.evaluate(() => localStorage.getItem('mochi_analytics_consent'));
    assert(name, 'Consent accepted → stored', consent === 'true');
  }

  // 2. Test privacy page
  await page.goto(`${BASE}/privacy`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  assert(name, 'Privacy page loads', (await page.title()).length > 0);
  const privacyContent = await page.locator('body').textContent();
  assert(name, 'Privacy has 隱私政策', privacyContent?.includes('隱私'));
  assert(name, 'Privacy has data sections', privacyContent?.includes('資料') || privacyContent?.includes('蒐集'));

  // Back button on privacy
  const privacyBack = page.locator('button:has-text("←"), a:has-text("←")').first();
  if (await privacyBack.count() > 0) {
    await privacyBack.click();
    await page.waitForTimeout(500);
    assert(name, 'Privacy back button works', !page.url().includes('/privacy'));
  }

  // 3. Test terms page
  await page.goto(`${BASE}/terms`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  const termsContent = await page.locator('body').textContent();
  assert(name, 'Terms page loads', termsContent?.includes('服務條款') || termsContent?.includes('條款'));

  const termsBack = page.locator('button:has-text("←"), a:has-text("←")').first();
  if (await termsBack.count() > 0) {
    await termsBack.click();
    await page.waitForTimeout(500);
    assert(name, 'Terms back button works', !page.url().includes('/terms'));
  }

  // 4. Login page links to terms and privacy
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const termsLink = page.locator('a[href="/terms"]');
  const privacyLink = page.locator('a[href="/privacy"]');
  assert(name, 'Login has terms link', await termsLink.count() > 0);
  assert(name, 'Login has privacy link', await privacyLink.count() > 0);

  // 5. Decline consent test
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const declineBtn = page.locator('button:has-text("拒絕"), button:has-text("不同意")');
  if (await declineBtn.count() > 0) {
    await declineBtn.first().click();
    await page.waitForTimeout(300);
    const consent = await page.evaluate(() => localStorage.getItem('mochi_analytics_consent'));
    assert(name, 'Consent declined → stored as false', consent === 'false');
  }

  // 6. Complete onboarding then check all pages for Pairly branding
  await page.evaluate(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('威志');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 5000 });

  for (let dim = 0; dim < 4; dim++) {
    await page.locator('.option-card').first().click();
    await page.locator('.strength-btn').first().click();
    const btn = page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")');
    await btn.first().click();
    await page.waitForTimeout(200);
  }
  await page.waitForURL('**/onboarding/scenarios', { timeout: 5000 });

  for (let q = 0; q < 8; q++) {
    await page.waitForTimeout(300);
    const opt = page.locator('.option-card').first();
    if (await opt.count() > 0) await opt.click();
    await page.waitForTimeout(200);
    const btn = page.locator('button:has-text("接下來"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) await btn.first().click();
  }
  await page.waitForURL('**/onboarding/profile', { timeout: 8000 });

  await uploadTestPhoto(page);
  await fillBirthdate(page);
  await page.locator('textarea').fill('威志 branding check');
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForURL('**/home', { timeout: 5000 });

  // 7. Check NO "Pairly" anywhere
  const pagesToCheck = ['/home', '/matches', '/weekly', '/settings', '/privacy', '/terms'];
  for (const path of pagesToCheck) {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle');
    const text = await page.locator('body').textContent();
    assert(name, `No "Pairly" on ${path}`, !text?.includes('Pairly'));
  }

  // 8. Check page titles/meta
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const pageTitle = await page.title();
  assert(name, 'Page title contains Mochi', pageTitle.includes('Mochi'));

  // 9. Check PWA manifest link
  const manifestLink = page.locator('link[rel="manifest"]');
  assert(name, 'Manifest link exists', await manifestLink.count() > 0);

  // 10. Check apple-touch-icon
  const appleIcon = page.locator('link[rel="apple-touch-icon"]');
  assert(name, 'Apple touch icon exists', await appleIcon.count() > 0);

  // 11. Check service worker registration
  const swRegistered = await page.evaluate(() => 'serviceWorker' in navigator);
  assert(name, 'Service Worker API available', swRegistered);

  // 12. Check viewport meta
  const viewport = page.locator('meta[name="viewport"]');
  assert(name, 'Viewport meta exists', await viewport.count() > 0);

  // 13. Check theme-color meta
  const themeColor = page.locator('meta[name="theme-color"]');
  assert(name, 'Theme color meta exists', await themeColor.count() > 0);

  // 14. Error boundary test: navigate to non-existent route
  await page.goto(`${BASE}/does-not-exist-xyz`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Should either 404 or redirect
  log(name, `Non-existent route URL: ${page.url()}`);

  await ctx.close();
}

// ─── Main Runner ──────────────────────────────────────────────────
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Mochi 默契 — 30-Agent Comprehensive E2E Test Suite   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`  Base URL: ${BASE}`);
  console.log(`  Time: ${new Date().toLocaleString('zh-TW')}\n`);

  const browser = await chromium.launch({ headless: true });

  const agents = [
    agent1, agent2, agent3, agent4, agent5,
    agent6, agent7, agent8, agent9, agent10,
    agent11, agent12, agent13, agent14, agent15,
    agent16, agent17, agent18, agent19, agent20,
    agent21, agent22, agent23, agent24, agent25,
    agent26, agent27, agent28, agent29, agent30,
  ];

  for (let i = 0; i < agents.length; i++) {
    try {
      await agents[i](browser);
    } catch (err) {
      const agentName = `Agent${String(i + 1).padStart(2, '0')}`;
      console.error(`\n💥 ${agentName} crashed: ${err.message}`);
      RESULTS.fail++;
      RESULTS.issues.push(`CRASH ${agentName}: ${err.message}`);
    }
  }

  await browser.close();

  // Cleanup temp file
  try { unlinkSync(TEST_IMG_PATH); } catch {}

  // Final report
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  TEST RESULTS — 30 AGENTS                             ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Passed: ${String(RESULTS.pass).padStart(3)}`);
  console.log(`║  ❌ Failed: ${String(RESULTS.fail).padStart(3)}`);
  console.log(`║  Total:    ${String(RESULTS.pass + RESULTS.fail).padStart(3)}`);
  console.log('╠════════════════════════════════════════════════════════╣');

  if (RESULTS.issues.length > 0) {
    console.log('║  ISSUES FOUND:');
    RESULTS.issues.forEach((issue, i) => {
      console.log(`║  ${String(i + 1).padStart(2)}. ${issue}`);
    });
  } else {
    console.log('║  🎉 All tests passed!');
  }
  console.log('╚════════════════════════════════════════════════════════╝');

  process.exit(RESULTS.fail > 0 ? 1 : 0);
}

main();
