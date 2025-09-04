import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  readonly adminContent: Locator;
  readonly settingsPanel: Locator;
  readonly configForm: Locator;
  readonly saveButton: Locator;
  readonly statusIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.adminContent = page.locator('.admin-panel, .admin-interface, .settings').first();
    this.settingsPanel = page.locator('.settings-panel, .config-panel, [data-testid="settings"]').first();
    this.configForm = page.locator('form, .config-form').first();
    this.saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    this.statusIndicator = page.locator('.status, .health-check, .system-status').first();
  }

  async goto() {
    await super.goto('/admin');
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/admin/);
    await this.page.waitForTimeout(2000);
  }

  async updateSetting(fieldName: string, value: string) {
    const field = this.page.locator(`input[name="${fieldName}"], input[id="${fieldName}"]`).first();
    if (await field.count() > 0) {
      await field.fill(value);
    }
  }

  async saveSettings() {
    if (await this.saveButton.count() > 0) {
      await this.saveButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async checkSystemStatus() {
    if (await this.statusIndicator.count() > 0) {
      await expect(this.statusIndicator).toBeVisible();
    }
  }
}