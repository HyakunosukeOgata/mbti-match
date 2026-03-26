import { chromium } from 'playwright';
import { writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_IMG_PATH = join(__dirname, '_debug-photo.png');

writeFileSync(
  TEST_IMG_PATH,
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  )
);

async function dismissConsent(page) {
  const acceptButton = page.locator('button:has-text("同意")');
  if (await acceptButton.count() > 0) {
    await acceptButton.first().click().catch(() => {});
    await page.waitForTimeout(150);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('console', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('pageerror', err.message));
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/dev-login') || url.includes('/api/social/') || url.includes('/api/delete-account')) {
      let body = '';
      try {
        body = await response.text();
      } catch {}
      console.log('api', response.status(), url, body.slice(0, 400));
    }
  });

  await page.goto('http://localhost:3001');
  await dismissConsent(page);
  await page.locator('input[type="text"]').fill('小美');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForURL('**/onboarding/mbti', { timeout: 20000 });
  console.log('after login', page.url());

  for (let dim = 0; dim < 4; dim++) {
    await dismissConsent(page);
    await page.locator('.option-card').nth(1).click();
    await page.locator('.strength-btn').nth(1).click();
    await page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")').first().click();
    await page.waitForTimeout(250);
  }

  await page.waitForURL('**/onboarding/scenarios', { timeout: 20000 });
  console.log('after mbti', page.url());

  for (let step = 0; step < 12 && !page.url().includes('/onboarding/profile'); step++) {
    await dismissConsent(page);
    const option = page.locator('.option-card').first();
    if (await option.count() > 0) {
      await option.click();
    }
    const btn = page.locator('button:has-text("對方的理想選擇"), button:has-text("下一題"), button:has-text("完成情境題")');
    if (await btn.count() > 0) {
      await btn.first().click();
    }
    await page.waitForTimeout(250);
    console.log('scenario step', step, page.url());
  }

  await page.waitForURL('**/onboarding/profile', { timeout: 20000 });
  console.log('at profile', page.url());

  await page.locator('input[type="file"]').setInputFiles(TEST_IMG_PATH);
  const selects = page.locator('select');
  console.log('select count', await selects.count());
  await selects.nth(0).selectOption('2000');
  await selects.nth(1).selectOption('1');
  await selects.nth(2).selectOption('1');
  await selects.nth(3).selectOption('台北市');
  await page.locator('input[placeholder="你的暱稱"]').fill('小美');
  await page.locator('textarea').fill('我是小美，喜歡旅行和看電影！');
  await page.locator('button:has-text("女生")').first().click();

  const completeButton = page.locator('button:has-text("完成設定")');
  console.log('complete disabled', await completeButton.isDisabled());
  await completeButton.click();

  for (let index = 0; index < 15; index++) {
    await page.waitForTimeout(1000);
    const body = await page.locator('body').innerText();
    console.log('post-complete', index, page.url(), body.slice(0, 250));
    if (body.includes('開始探索配對')) {
      await page.locator('button:has-text("開始探索配對")').click().catch(() => {});
    }
    if (page.url().includes('/home')) break;
  }

  console.log('final', page.url());
  await browser.close();
  try { unlinkSync(TEST_IMG_PATH); } catch {}
}

main().catch((error) => {
  console.error(error);
  try { unlinkSync(TEST_IMG_PATH); } catch {}
  process.exit(1);
});
