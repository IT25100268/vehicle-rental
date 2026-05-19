const { devices } = require('@playwright/test');

module.exports = {
  testDir: './tests',
  timeout: 30 * 1000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
};
