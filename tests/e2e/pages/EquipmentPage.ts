import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class EquipmentPage extends BasePage {
  readonly equipmentCatalog: Locator;
  readonly equipmentList: Locator;
  readonly equipmentItems: Locator;

  constructor(page: Page) {
    super(page);
    this.equipmentCatalog = page.locator('.equipment-catalog, .equipment-list, .catalog').first();
    this.equipmentList = page.locator('[data-testid="equipment-list"], .equipment-grid, .equipment-items');
    this.equipmentItems = page.locator('.equipment-item, .equipment-card, [data-equipment]');
  }

  async goto() {
    await super.goto('/equipment');
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/equipment/);
    await this.page.waitForTimeout(2000);
    
    if (await this.equipmentCatalog.count() > 0) {
      await expect(this.equipmentCatalog).toBeVisible();
    }
  }

  async getEquipmentCount() {
    await this.page.waitForTimeout(1000);
    return await this.equipmentItems.count();
  }

  async clickEquipmentItem(index: number = 0) {
    const count = await this.equipmentItems.count();
    if (count > index) {
      await this.equipmentItems.nth(index).click();
    }
  }
}