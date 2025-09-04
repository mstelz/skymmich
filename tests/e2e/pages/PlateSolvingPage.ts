import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PlateSolvingPage extends BasePage {
  readonly plateSolvingContent: Locator;
  readonly uploadArea: Locator;
  readonly solveButton: Locator;
  readonly resultsArea: Locator;

  constructor(page: Page) {
    super(page);
    this.plateSolvingContent = page.locator('.plate-solving, .solver-interface, .solving-panel').first();
    this.uploadArea = page.locator('[data-testid="upload"], .upload-area, .file-drop').first();
    this.solveButton = page.locator('button:has-text("Solve"), button:has-text("Start"), .solve-btn').first();
    this.resultsArea = page.locator('.results, .solution-results, [data-testid="results"]').first();
  }

  async goto() {
    await super.goto('/plate-solving');
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/plate-solving/);
    await this.page.waitForTimeout(2000);
  }

  async uploadFile(filePath: string) {
    if (await this.uploadArea.count() > 0) {
      const fileInput = this.page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles(filePath);
      }
    }
  }

  async startSolving() {
    if (await this.solveButton.count() > 0) {
      await this.solveButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async waitForResults(timeout: number = 30000) {
    if (await this.resultsArea.count() > 0) {
      await expect(this.resultsArea).toBeVisible({ timeout });
    }
  }
}