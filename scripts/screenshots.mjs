// App Store Screenshot Generator
// Captures screenshots at iPhone 16 Pro Max resolution (1320×2868 @3x → 440×956 viewport)
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3001';
const OUT = 'screenshots';

// iPhone 16 Pro Max: 1320×2868 pixels, 3x scale
const device = { width: 440, height: 956, deviceScaleFactor: 3 };

// Pages to screenshot with display names
const pages = [
  { path: '/', name: '01-login', wait: 1000 },
  { path: '/onboarding/mbti', name: '02-mbti-test', wait: 1500 },
  { path: '/onboarding/scenarios', name: '03-scenarios', wait: 1500 },
  { path: '/home', name: '04-daily-matches', wait: 2000 },
  { path: '/matches', name: '05-matches', wait: 1500 },
  { path: '/settings', name: '06-settings', wait: 1500 },
];

async function main() {
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.deviceScaleFactor,
    locale: 'zh-TW',
    colorScheme: 'light',
  });

  const page = await context.newPage();

  // First, create a test user so we can access protected pages
  console.log('Setting up test user...');
  await page.goto(`${BASE}/`);
  await page.waitForTimeout(1000);

  // Take login page screenshot BEFORE logging in
  await page.screenshot({ path: `${OUT}/01-login.png`, fullPage: false });
  console.log('✓ 01-login.png');

  // Try to log in
  const nameInput = page.locator('input[placeholder*="暱稱"], input[placeholder*="名字"], input[type="text"]').first();
  if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameInput.fill('Mochi');
    // Find and click the login/start button
    const loginBtn = page.locator('button:has-text("開始"), button:has-text("登入"), button:has-text("進入")').first();
    if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // MBTI test page
  await page.goto(`${BASE}/onboarding/mbti`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/02-mbti-test.png`, fullPage: false });
  console.log('✓ 02-mbti-test.png');

  // Complete MBTI quickly by setting localStorage
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('mochi_profile') || '{}');
    profile.mbtiResult = {
      type: 'ENFJ',
      scores: { E: 80, I: 20, S: 30, N: 70, T: 35, F: 65, J: 60, P: 40 },
      dominantTraits: { EI: 'E', SN: 'N', TF: 'F', JP: 'J' },
    };
    profile.mbtiCompleted = true;
    localStorage.setItem('mochi_profile', JSON.stringify(profile));
  });

  // Scenario questions page
  await page.goto(`${BASE}/onboarding/scenarios`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/03-scenarios.png`, fullPage: false });
  console.log('✓ 03-scenarios.png');

  // Set scenario answers to unlock home
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('mochi_profile') || '{}');
    profile.scenarioAnswers = profile.scenarioAnswers || {};
    for (let i = 1; i <= 4; i++) profile.scenarioAnswers[`q${i}`] = 'A';
    profile.scenariosCompleted = true;
    localStorage.setItem('mochi_profile', JSON.stringify(profile));
  });

  // Daily matches / Home
  await page.goto(`${BASE}/home`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/04-daily-matches.png`, fullPage: false });
  console.log('✓ 04-daily-matches.png');

  // Matches page
  await page.goto(`${BASE}/matches`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/05-matches.png`, fullPage: false });
  console.log('✓ 05-matches.png');

  // Settings page
  await page.goto(`${BASE}/settings`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/06-settings.png`, fullPage: false });
  console.log('✓ 06-settings.png');

  await browser.close();
  console.log(`\n✅ All screenshots saved to ${OUT}/`);
  console.log(`Resolution: ${device.width * device.deviceScaleFactor}×${device.height * device.deviceScaleFactor} px (iPhone 16 Pro Max)`);
}

main().catch(console.error);
