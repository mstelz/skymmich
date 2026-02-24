import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class EquipmentPage extends BasePage {
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly emptyState: Locator;
  readonly equipmentCards: Locator;

  // Add equipment form
  readonly addFormTitle: Locator;
  readonly nameInput: Locator;
  readonly typeSelect: Locator;
  readonly descriptionInput: Locator;
  readonly specKeyInput: Locator;
  readonly specValueInput: Locator;
  readonly addSpecButton: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly closeFormButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /equipment catalog/i });
    this.addButton = page.getByRole('button', { name: /add new equipment/i });
    this.emptyState = page.getByText(/no equipment found/i);
    this.equipmentCards = page.locator('.space-y-4 > div').filter({ has: page.locator('.font-semibold') });

    // Add form elements
    this.addFormTitle = page.getByRole('heading', { name: 'Add New Equipment' });
    this.nameInput = page.getByPlaceholder('e.g., William Optics RedCat 51');
    this.typeSelect = page.locator('select').first();
    this.descriptionInput = page.getByPlaceholder('Brief description of the equipment...');
    this.specKeyInput = page.getByPlaceholder('e.g., focalLength');
    this.specValueInput = page.getByPlaceholder('e.g., 250mm');
    this.addSpecButton = page.getByRole('button', { name: 'Add', exact: true });
    this.submitButton = page.getByRole('button', { name: /add equipment/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.closeFormButton = page.locator('button').filter({ has: page.locator('svg') }).first();
  }

  async goto() {
    await super.goto('/equipment');
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/equipment/);
    await expect(this.heading).toBeVisible();
    await expect(this.addButton).toBeVisible();
  }

  async openAddForm() {
    await this.addButton.click();
    await expect(this.addFormTitle).toBeVisible();
  }

  async fillEquipmentForm(name: string, type: string, description?: string) {
    await this.nameInput.fill(name);
    await this.typeSelect.selectOption(type);
    if (description) {
      await this.descriptionInput.fill(description);
    }
  }

  async hasEquipment() {
    return (await this.emptyState.count()) === 0;
  }
}
