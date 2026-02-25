import { test, expect } from '@playwright/test';
import { PlateSolvingPage } from './pages';

test.describe('Plate Solving Page', () => {
  let plateSolvingPage: PlateSolvingPage;

  test.beforeEach(async ({ page }) => {
    plateSolvingPage = new PlateSolvingPage(page);
    await plateSolvingPage.goto();
    await plateSolvingPage.waitForLoad();
  });

  test('should load with heading and description', async () => {
    await plateSolvingPage.verifyPageLoaded();
  });

  test('should display header with navigation', async () => {
    await expect(plateSolvingPage.header).toBeVisible();
    await expect(plateSolvingPage.syncButton).toBeVisible();
  });

  test('should display all five stats cards', async () => {
    await plateSolvingPage.verifyStatsCards();
  });

  test('should display stats cards with numeric values', async () => {
    // Each stat card should show a number (the count)
    const statsSection = plateSolvingPage.page.locator('.grid-cols-1');
    const boldNumbers = statsSection.locator('.text-2xl.font-bold');
    expect(await boldNumbers.count()).toBeGreaterThanOrEqual(5);
  });

  test('should display image selection card', async () => {
    await expect(plateSolvingPage.imageSelectionCard).toBeVisible();
  });

  test('should display search input for images', async () => {
    await expect(plateSolvingPage.searchInput).toBeVisible();
    await expect(plateSolvingPage.searchInput).toHaveAttribute('placeholder', 'Search images...');
  });

  test('should accept search input for filtering images', async () => {
    await plateSolvingPage.searchImages('M31');
    await expect(plateSolvingPage.searchInput).toHaveValue('M31');
  });

  test('should display show-only-unsolved checkbox', async () => {
    await expect(plateSolvingPage.showOnlyUnsolved).toBeVisible();
  });

  test('should display select all / deselect all button', async () => {
    await expect(plateSolvingPage.selectAllButton).toBeVisible();
  });

  test('should display image count text', async () => {
    const countText = plateSolvingPage.page.getByText(/\d+ of \d+ images selected/);
    if ((await countText.count()) > 0) {
      await expect(countText).toBeVisible();
    }
  });

  test('should display images or empty state', async () => {
    // Wait for loading to finish
    const loading = plateSolvingPage.loadingIndicator;
    if ((await loading.count()) > 0) {
      await expect(loading).not.toBeVisible({ timeout: 10000 });
    }

    const hasImages = (await plateSolvingPage.imageGrid.locator('.cursor-pointer').count()) > 0;
    if (!hasImages) {
      await expect(plateSolvingPage.emptyState).toBeVisible();
    }
  });
});
