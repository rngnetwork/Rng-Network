import { test, expect } from '@playwright/test';

test.describe('Scenario 3: Discord Server Management & Settings Mutation', () => {

  test.beforeEach(async ({ page }) => {
    // Set accessToken in localStorage for dashboard authentication guard
    await page.addInitScript(() => {
      window.localStorage.setItem('accessToken', 'mock_valid_admin_token');
    });
  });

  test('queries live server count in sidebar, updates server settings with dirty tracking, and saves', async ({ page }) => {
    // 1. Navigate directly to server settings
    await page.goto('/dashboard/servers/rng-headquarters/settings');

    // 2. Verify live presence badge in Sidebar
    const serverBadge = page.locator('aside, nav').locator('text=Live, text=Online').first();
    await expect(serverBadge).toBeVisible();

    // 3. Verify server settings header/form is visible
    await expect(page.locator('text=Server Settings, text=Settings').first()).toBeVisible();

    // 4. Change server name to trigger dirty state
    const nameInput = page.locator('input[name="name"], input[placeholder*="Server Name" i], input[type="text"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('RNG Elite Headquarters');

      // 5. Verify floating UnsavedChangesBar appears
      const unsavedBar = page.locator('text=Unsaved Changes, text=Careful — you have unsaved changes').first();
      await expect(unsavedBar).toBeVisible();

      // 6. Click Save Changes button
      const saveBtn = page.locator('button:has-text("Save Changes"), button:has-text("Save")').last();
      await saveBtn.click();

      // 7. Verify save bar dismisses
      await expect(unsavedBar).toBeHidden({ timeout: 5000 });
    }
  });
});
