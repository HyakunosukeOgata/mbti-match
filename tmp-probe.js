const { chromium } = require('playwright');
const fs = require('fs');

async function dismissConsent(page) {
  const button = page.locator('button:has-text("同意")');
  if (await button.count()) {
    await button.first().click().catch(() => {});
    await page.waitForTimeout(150);
  }
}

(async () => {
  const testImage = '/tmp/mbti-probe.png';
  fs.writeFileSync(
    testImage,
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
  );

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => localStorage.setItem('mochi_analytics_consent', 'true'));
  const page = await ctx.newPage();

  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  await dismissConsent(page);
  await page.locator('input[type="text"]').fill('Probe');
  await page.locator('button:has-text("開始配對之旅")').click();
  await page.waitForTimeout(500);
  console.log('after start', page.url());

  for (let dim = 0; dim < 4; dim++) {
    await page.locator('.option-card').first().click();
    await page.locator('.strength-btn').first().click();
    await page.locator('button:has-text("下一個維度"), button:has-text("完成 MBTI")').first().click();
    await page.waitForTimeout(200);
  }

  await page.waitForURL('http://localhost:3001/onboarding/scenarios');
  console.log('after mbti', page.url());

  for (let step = 0; step < 12 && !page.url().includes('/onboarding/profile'); step++) {
    const option = page.locator('.option-card').first();
    if (await option.count()) {
      await option.click();
    }
    const nextButton = page.locator('button:has-text("對方的理想選擇"), button:has-text("下一題"), button:has-text("完成情境題")').first();
    if (await nextButton.count()) {
      await nextButton.click();
    }
    await page.waitForTimeout(200);
  }

  console.log('after scenarios', page.url());
  await page.setInputFiles('input[type="file"]', testImage);
  const selects = page.locator('select');
  await selects.nth(0).selectOption('2000');
  await selects.nth(1).selectOption('1');
  await selects.nth(2).selectOption('1');
  await page.locator('input[placeholder="你的暱稱"]').fill('Probe');
  await selects.nth(3).selectOption('台北市');
  await page.locator('textarea').fill('probe bio');
  await page.locator('button:has-text("男生")').first().click();
  await page.locator('button:has-text("完成設定")').click();
  await page.waitForTimeout(5000);

  console.log('after complete', page.url());
  console.log('body snippet', (await page.locator('body').textContent()).slice(0, 500));

  const apiResult = await page.evaluate(async () => {
    const authKey = Object.keys(localStorage).find((key) => key.includes('auth-token'));
    const token = authKey ? JSON.parse(localStorage.getItem(authKey) || 'null')?.access_token : null;
    if (!token) {
      return { error: 'no token', keys: Object.keys(localStorage) };
    }

    const response = await fetch('/api/social/cards', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      status: response.status,
      data: await response.json(),
    };
  });

  console.dir(apiResult, { depth: 5 });
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
