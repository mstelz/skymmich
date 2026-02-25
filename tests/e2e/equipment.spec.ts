import { test, expect } from '@playwright/test';
import { EquipmentPage } from './pages';

test.describe('Equipment Page', () => {
  let equipmentPage: EquipmentPage;

  test.beforeEach(async ({ page }) => {
    equipmentPage = new EquipmentPage(page);
    await equipmentPage.goto();
    await equipmentPage.waitForLoad();
  });

  test('should load with heading and add button', async () => {
    await equipmentPage.verifyPageLoaded();
  });

  test('should display header with navigation', async () => {
    await expect(equipmentPage.header).toBeVisible();
    await expect(equipmentPage.syncButton).toBeVisible();
  });

  test('should show equipment list or empty state', async () => {
    const hasEquipment = await equipmentPage.hasEquipment();
    if (hasEquipment) {
      const cards = equipmentPage.equipmentCards;
      expect(await cards.count()).toBeGreaterThan(0);
    } else {
      await expect(equipmentPage.emptyState).toBeVisible();
    }
  });

  test('should open add equipment form', async () => {
    await equipmentPage.openAddForm();
    await expect(equipmentPage.nameInput).toBeVisible();
    await expect(equipmentPage.typeSelect).toBeVisible();
    await expect(equipmentPage.descriptionInput).toBeVisible();
  });

  test('should show all equipment type options in dropdown', async () => {
    await equipmentPage.openAddForm();
    const options = equipmentPage.typeSelect.locator('option');
    const optionTexts = await options.allTextContents();

    expect(optionTexts).toContain('Telescope');
    expect(optionTexts).toContain('Camera');
    expect(optionTexts).toContain('Mount');
    expect(optionTexts).toContain('Filter');
    expect(optionTexts).toContain('Accessory');
    expect(optionTexts).toContain('Software');
  });

  test('should disable submit button when required fields are empty', async () => {
    await equipmentPage.openAddForm();
    await expect(equipmentPage.submitButton).toBeDisabled();
  });

  test('should enable submit button when required fields are filled', async () => {
    await equipmentPage.openAddForm();
    await equipmentPage.fillEquipmentForm('Test Telescope', 'telescope');
    await expect(equipmentPage.submitButton).toBeEnabled();
  });

  test('should close add form with cancel button', async () => {
    await equipmentPage.openAddForm();
    await expect(equipmentPage.addFormTitle).toBeVisible();
    await equipmentPage.cancelButton.click();
    await expect(equipmentPage.addFormTitle).not.toBeVisible();
  });

  test('should show specification inputs in add form', async () => {
    await equipmentPage.openAddForm();
    await expect(equipmentPage.specKeyInput).toBeVisible();
    await expect(equipmentPage.specValueInput).toBeVisible();
    await expect(equipmentPage.addSpecButton).toBeVisible();
  });

  test('should disable Add spec button when inputs are empty', async () => {
    await equipmentPage.openAddForm();
    await expect(equipmentPage.addSpecButton).toBeDisabled();
  });

  test('should enable Add spec button when both key and value are filled', async () => {
    await equipmentPage.openAddForm();
    await equipmentPage.specKeyInput.fill('focalLength');
    await equipmentPage.specValueInput.fill('250mm');
    await expect(equipmentPage.addSpecButton).toBeEnabled();
  });

  test('should display edit and delete buttons on equipment cards', async () => {
    const hasEquipment = await equipmentPage.hasEquipment();
    if (!hasEquipment) {
      test.skip();
      return;
    }

    // Look for edit/delete icon buttons within equipment cards
    const firstCard = equipmentPage.equipmentCards.first();
    const buttons = firstCard.locator('button');
    expect(await buttons.count()).toBeGreaterThanOrEqual(2);
  });
});
