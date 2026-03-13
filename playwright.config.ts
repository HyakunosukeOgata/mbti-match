import { defineConfig } from '@playwright/test';

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
  reporter: [['list']],
});
