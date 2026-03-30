import { defineConfig } from '@playwright/test';

const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  workers: 1, // Sequential to avoid localStorage conflicts
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    viewport: { width: 430, height: 932 }, // iPhone 15 Pro Max
    actionTimeout: 10000,
  },
  ...(shouldStartWebServer
    ? {
        webServer: {
          command: 'npm run dev -- --webpack --port 3001 --hostname 127.0.0.1',
          url: 'http://127.0.0.1:3001',
          reuseExistingServer: true,
          timeout: 120000,
        },
      }
    : {}),
  reporter: [['list']],
});
