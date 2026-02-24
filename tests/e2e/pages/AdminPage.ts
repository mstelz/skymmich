import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  readonly heading: Locator;
  readonly saveButton: Locator;

  // Immich configuration
  readonly immichHostInput: Locator;
  readonly immichApiKeyInput: Locator;
  readonly immichAutoSyncSwitch: Locator;
  readonly immichSyncByAlbumSwitch: Locator;
  readonly immichSyncFrequencyInput: Locator;
  readonly immichTestConnectionButton: Locator;

  // Astrometry configuration
  readonly astrometryEnabledSwitch: Locator;
  readonly astrometryApiKeyInput: Locator;
  readonly astrometryAutoEnabledSwitch: Locator;
  readonly astrometryTestConnectionButton: Locator;
  readonly checkIntervalInput: Locator;
  readonly pollIntervalInput: Locator;
  readonly maxConcurrentInput: Locator;
  readonly autoResubmitSwitch: Locator;

  // Application settings
  readonly debugModeSwitch: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /admin settings/i, level: 1 });
    this.saveButton = page.getByRole('button', { name: /save settings/i });

    // Immich
    this.immichHostInput = page.locator('#immichHost');
    this.immichApiKeyInput = page.locator('#immichApiKey');
    this.immichAutoSyncSwitch = page.locator('#immichAutoSync');
    this.immichSyncByAlbumSwitch = page.locator('#immichSyncByAlbum');
    this.immichSyncFrequencyInput = page.locator('#immichSyncFrequency');
    this.immichTestConnectionButton = page.getByRole('button', { name: /test connection/i }).first();

    // Astrometry
    this.astrometryEnabledSwitch = page.locator('#astrometryEnabled');
    this.astrometryApiKeyInput = page.locator('#astrometryApiKey');
    this.astrometryAutoEnabledSwitch = page.locator('#astrometryAutoEnabled');
    this.astrometryTestConnectionButton = page.getByRole('button', { name: /test connection/i }).last();
    this.checkIntervalInput = page.locator('#checkInterval');
    this.pollIntervalInput = page.locator('#pollInterval');
    this.maxConcurrentInput = page.locator('#maxConcurrent');
    this.autoResubmitSwitch = page.locator('#autoResubmit');

    // App settings
    this.debugModeSwitch = page.locator('#debugMode');
  }

  async goto() {
    await super.goto('/admin');
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/admin/);
    await expect(this.heading).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  async verifyConfigSections() {
    await expect(this.page.getByText('Immich Configuration')).toBeVisible();
    await expect(this.page.getByText('Astrometry.net Configuration')).toBeVisible();
    await expect(this.page.getByText('Application Settings')).toBeVisible();
  }

  async verifyFormFields() {
    await expect(this.immichHostInput).toBeVisible();
    await expect(this.immichApiKeyInput).toBeVisible();
    await expect(this.debugModeSwitch).toBeVisible();
  }
}
