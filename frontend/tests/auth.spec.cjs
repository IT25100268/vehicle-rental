const { test, expect } = require('@playwright/test');

test('open auth modal and perform login (mocked)', async ({ page }) => {
  // Mock the login API to return a successful user
  await page.route('**/api/auth/login', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'UI Test', email: 'ui@test.example', role: 'USER' })
    });
  });

  await page.goto('/');

  // Open the sign in modal
  await page.click('text=Sign in');

  // Expect modal to be visible
  await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();

  // Fill credentials
  await page.fill('#auth-email', 'ui@test.example');
  await page.fill('#auth-password', 'abc123');

  // Submit
  await page.click('#auth-submit-btn');

  // After success the app sets localStorage 'user'
  await page.waitForTimeout(400);
  const stored = await page.evaluate(() => localStorage.getItem('user'));
  expect(stored).not.toBeNull();
  const user = JSON.parse(stored);
  expect(user.email).toBe('ui@test.example');
});
