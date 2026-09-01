import { test, expect } from '@playwright/test';

test.describe('Scenario 1: Auto-Registration & Discord 2FA Flow', () => {

  test('whitelisted email auto-registers password, completes Discord 2FA and lands on Dashboard', async ({ page }) => {
    // Intercept third-party Discord OAuth2 authorization dialog
    await page.route('**/oauth2/authorize*', async (route) => {
      const url = new URL(route.request().url());
      const state = url.searchParams.get('state');
      await route.fulfill({
        status: 302,
        headers: {
          Location: `/auth/discord/callback?code=mock_e2e_discord_code&state=${state || ''}`,
        },
      });
    });

    // 1. Visit landing page
    await page.goto('/');

    // 2. Click "Sign In to RAC" if starting on RoleSelector
    const signInRacButton = page.locator('button:has-text("Sign In to RAC")');
    if (await signInRacButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signInRacButton.click();
    }

    // 3. Fill email & password
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('arzenic@rednecksgaming.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('ArzenicSecure2026!');

    // 4. Submit credentials
    const submitButton = page.locator('form button[type="submit"]');
    await submitButton.click();

    // 5. If 2FA modal/button appears, click through to Discord OAuth
    const continueDiscordBtn = page.locator('button:has-text("Continue to Discord"), button:has-text("Connect with Discord")');
    if (await continueDiscordBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueDiscordBtn.click();
    }

    // 6. Verify successful navigation to Dashboard shell
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });
    await expect(page.locator('text=Control Center, text=High Command, text=Servers').first()).toBeVisible();
  });
});
