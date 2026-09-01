import { test, expect } from '@playwright/test';

test.describe('Scenario 2: Discord-Verified Password Recovery Subsystem', () => {

  test('initiates recovery, exchanges Discord verification, sets new password, and redirects with success notice', async ({ page }) => {
    // Intercept third-party Discord OAuth2 recovery authorization dialog
    await page.route('**/oauth2/authorize*', async (route) => {
      const url = new URL(route.request().url());
      const state = url.searchParams.get('state');
      await route.fulfill({
        status: 302,
        headers: {
          Location: `/auth/discord/callback?code=mock_recovery_discord_code&state=${state || ''}`,
        },
      });
    });

    // 1. Visit landing page
    await page.goto('/');

    // 2. Switch to login panel if starting on RoleSelector
    const signInRacButton = page.locator('button:has-text("Sign In to RAC")');
    if (await signInRacButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signInRacButton.click();
    }

    // 3. Click "Forgot password?" in LoginPanel
    const forgotPasswordLink = page.locator('button:has-text("Forgot password?")');
    await expect(forgotPasswordLink).toBeVisible({ timeout: 5000 });
    await forgotPasswordLink.click();

    // 4. Enter recovery email
    const recoveryEmailInput = page.locator('input[type="email"]');
    await recoveryEmailInput.fill('arzenic@rednecksgaming.com');

    // 5. Submit recovery request
    const recoverButton = page.locator('form button[type="submit"]');
    await recoverButton.click();

    // 6. Discord callback intercepts and routes to /auth/reset-password
    await page.waitForURL('**/auth/reset-password**', { timeout: 15000 });
    await expect(page.locator('text=Set New Password, text=Reset Password').first()).toBeVisible();

    // 7. Enter new matching passwords
    const newPasswordInput = page.locator('input[type="password"]').first();
    await newPasswordInput.fill('NewStrongPassword#2026!');

    const confirmPasswordInput = page.locator('input[type="password"]').last();
    await confirmPasswordInput.fill('NewStrongPassword#2026!');

    // 8. Verify strength meter & match indicator
    await expect(page.locator('text=Strong, text=Passwords Match, text=Very Strong').first()).toBeVisible();

    // 9. Submit password reset
    const submitResetBtn = page.locator('button:has-text("Update Password"), button:has-text("Reset Password")').last();
    await submitResetBtn.click();

    // 10. Verify redirection back to login with notice query param
    await page.waitForURL('**/?notice=password_reset_success**', { timeout: 10000 });
    await expect(page.locator('text=Password reset successfully, text=Success').first()).toBeVisible();
  });
});
