import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'e2e/test-results.json' }]],
  use: {
    baseURL: 'https://www.soloboard.app',
    ignoreHTTPSErrors: true,
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});




