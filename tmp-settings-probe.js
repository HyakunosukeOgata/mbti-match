const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:3001';
const IMG = '/tmp/mbti-settings-probe.png';
fs.writeFileSync(IMG, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==','base64'));

async function dismissConsent(page) {
  const btn = page.locator('button:has-text("同意")');
  if (await btn.count()) {
    await btn.first().click().catch(() => {});
    await page.waitForTimeout(150);
  }
}

async function completeProfileOnboarding(page, { name, bio, gender = '男生 🙋‍♂️', region = '台北市' }) {
  await page.setInputFiles('input[type="file"]', IMG);
  const selects = page.locator('select');
  await selects.nth(0).selectOption('2000');
  await selects.nth(1).selectOption('1');
  await selects.nth(2).selectOption('1');
  await page.locator('input[placeholder="你的暱稱"]').fill(name);
  await selects.nth(3).selectOption(region);
  await page.locator('textarea').fill(bio);
  const genderButton = page.locator(`button:has-text("${gender}")`).first();
  if (await genderButton.count()) await genderButton.click();
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForTimeout(5000);
  const explore = page.locator('button:has-text("開始探索配對")');
  if (await explore.count()) await explore.click();
  await page.waitForTimeout(3000);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await dismissConsent(page);
  await page.locator('input[type="text"]').fill('阿凱');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForTimeout(500);
  for (let i = 0; i < 4; i++) {
    await page.locator('.option-card').first().click();
    await page.locator('.strength-btn').first().click();
    await page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")').first().click();
    await page.waitForTimeout(200);
  }
  for (let i = 0; i < 12 && !page.url().includes('/onboarding/profile'); i++) {
    const option = page.locator('.option-card').first();
    if (await option.count()) await option.click();
    const next = page.locator('button:has-text("對方的理想選擇"), button:has-text("下一題"), button:has-text("完成情境題")').first();
    if (await next.count()) await next.click();
    await page.waitForTimeout(250);
  }
  await completeProfileOnboarding(page, { name: '阿凱', bio: '阿凱 ESTJ' });
  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  const body = await page.locator('body').textContent();
  console.log('SETTINGS_URL', page.url());
  console.log('HAS_NAME', body.includes('阿凱'));
  console.log('HAS_ESTJ', body.includes('ESTJ'));
  console.log('BODY_START', body.slice(0, 1000));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
