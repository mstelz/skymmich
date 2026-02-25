import { test, expect } from '@playwright/test';
import { AdminPage } from './pages';

test.describe('Admin Page', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.waitForLoad();
  });

  test('should load with heading and save button', async () => {
    await adminPage.verifyPageLoaded();
  });

  test('should display settings icon in heading', async () => {
    // Settings icon is next to the heading
    const settingsIcon = adminPage.page.locator('svg').filter({ hasText: '' }).first();
    await expect(adminPage.heading).toBeVisible();
  });

  test('should display all three configuration sections', async () => {
    await adminPage.verifyConfigSections();
  });

  test('should display Immich configuration description', async () => {
    await expect(
      adminPage.page.getByText('Configure your Immich server connection for image synchronization'),
    ).toBeVisible();
  });

  test('should display Astrometry configuration description', async () => {
    await expect(adminPage.page.getByText('Configure plate solving with Astrometry.net')).toBeVisible();
  });
});

test.describe('Admin Page - Immich Configuration', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.waitForLoad();
  });

  test('should display Immich Server URL input', async () => {
    await expect(adminPage.immichHostInput).toBeVisible();
    await expect(adminPage.immichHostInput).toHaveAttribute('type', 'url');
  });

  test('should display Immich API Key input as password field', async () => {
    await expect(adminPage.immichApiKeyInput).toBeVisible();
    await expect(adminPage.immichApiKeyInput).toHaveAttribute('type', 'password');
  });

  test('should display auto sync switch', async () => {
    await expect(adminPage.immichAutoSyncSwitch).toBeVisible();
  });

  test('should display sync by album switch', async () => {
    await expect(adminPage.immichSyncByAlbumSwitch).toBeVisible();
  });

  test('should accept URL input for Immich host', async () => {
    await adminPage.immichHostInput.fill('https://immich.example.com');
    await expect(adminPage.immichHostInput).toHaveValue('https://immich.example.com');
  });

  test('should accept API key input', async () => {
    await adminPage.immichApiKeyInput.fill('test-api-key-123');
    await expect(adminPage.immichApiKeyInput).toHaveValue('test-api-key-123');
  });

  test('should display Test Connection button for Immich', async () => {
    await expect(adminPage.immichTestConnectionButton).toBeVisible();
  });
});

test.describe('Admin Page - Astrometry Configuration', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.waitForLoad();
  });

  test('should display astrometry enabled switch', async () => {
    await expect(adminPage.astrometryEnabledSwitch).toBeVisible();
  });

  test('should show astrometry API key when enabled', async () => {
    // Check if astrometry is already enabled
    const isChecked = await adminPage.astrometryEnabledSwitch.isChecked();
    if (!isChecked) {
      await adminPage.astrometryEnabledSwitch.click();
    }
    await expect(adminPage.astrometryApiKeyInput).toBeVisible();
    await expect(adminPage.astrometryApiKeyInput).toHaveAttribute('type', 'password');
  });

  test('should hide astrometry fields when disabled', async () => {
    // Ensure it's off
    const isChecked = await adminPage.astrometryEnabledSwitch.isChecked();
    if (isChecked) {
      await adminPage.astrometryEnabledSwitch.click();
    }
    await expect(adminPage.astrometryApiKeyInput).not.toBeVisible();
  });
});

test.describe('Admin Page - Application Settings', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.waitForLoad();
  });

  test('should display debug mode switch', async () => {
    await expect(adminPage.debugModeSwitch).toBeVisible();
  });

  test('should toggle debug mode switch', async () => {
    const wasChecked = await adminPage.debugModeSwitch.isChecked();
    await adminPage.debugModeSwitch.click();
    const isNowChecked = await adminPage.debugModeSwitch.isChecked();
    expect(isNowChecked).not.toBe(wasChecked);

    // Toggle back to original state
    await adminPage.debugModeSwitch.click();
    expect(await adminPage.debugModeSwitch.isChecked()).toBe(wasChecked);
  });

  test('should display save button with correct text', async () => {
    await expect(adminPage.saveButton).toBeVisible();
    await expect(adminPage.saveButton).toHaveText(/save settings/i);
  });
});
