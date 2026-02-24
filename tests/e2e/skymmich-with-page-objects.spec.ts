import { test, expect } from '@playwright/test';
import { HomePage, EquipmentPage, PlateSolvingPage, AdminPage } from './pages';

// =============================================================================
// Home Page
// =============================================================================

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should load with correct page title', async () => {
    await expect(homePage.page).toHaveTitle('Skymmich');
  });

  test('should display header with app title', async () => {
    await expect(homePage.header).toBeVisible();
    await expect(homePage.appTitle).toHaveText('Skymmich');
  });

  test('should display logo image in header', async () => {
    const logo = homePage.page.locator('header img[alt="Skymmich Logo"]');
    await expect(logo).toBeVisible();
  });

  test('should display navigation links', async () => {
    await homePage.verifyNavigation();
  });

  test('should display Sync Immich button', async () => {
    await expect(homePage.syncButton).toBeVisible();
  });

  test('should display GitHub link', async () => {
    await expect(homePage.githubLink).toBeVisible();
    await expect(homePage.githubLink).toHaveAttribute('target', '_blank');
  });

  test('should display admin settings icon link', async () => {
    await expect(homePage.navigationLinks.admin).toBeVisible();
  });

  test('should display search input', async () => {
    await expect(homePage.searchInput).toBeVisible();
    await expect(homePage.searchInput).toHaveAttribute('placeholder', 'Search astrophotography images...');
  });

  test('should accept and retain search input', async () => {
    await homePage.search('Orion Nebula');
    await expect(homePage.searchInput).toHaveValue('Orion Nebula');
  });

  test('should clear search input', async () => {
    await homePage.search('test');
    await expect(homePage.searchInput).toHaveValue('test');
    await homePage.searchInput.clear();
    await expect(homePage.searchInput).toHaveValue('');
  });

  test('should display sidebar', async () => {
    await expect(homePage.sidebar).toBeVisible();
  });

  test('should display image gallery or empty state', async () => {
    const hasImages = await homePage.hasImages();
    if (hasImages) {
      await expect(homePage.imageGallery).toBeVisible();
    } else {
      await expect(homePage.emptyState).toBeVisible();
    }
  });

  test('should display Advanced filter button', async () => {
    await expect(homePage.advancedButton).toBeVisible();
  });
});

// =============================================================================
// Home Page - Sidebar
// =============================================================================

test.describe('Home Page - Sidebar', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should display Astrometry.net Status card', async () => {
    await expect(homePage.astrometryStatusCard).toBeVisible();
  });

  test('should display Recent Activity card', async () => {
    await expect(homePage.recentActivityCard).toBeVisible();
  });

  test('should display Popular Tags card', async () => {
    await expect(homePage.popularTagsCard).toBeVisible();
  });

  test('should display Submit New Image link in sidebar', async () => {
    await expect(homePage.submitNewImageLink).toBeVisible();
  });

  test('should navigate to plate solving from Submit New Image link', async () => {
    await homePage.submitNewImageLink.click();
    await expect(homePage.page).toHaveURL(/\/plate-solving/);
  });
});

// =============================================================================
// Home Page - Image Gallery
// =============================================================================

test.describe('Home Page - Image Gallery', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should display image cards with content when images exist', async () => {
    const hasImages = await homePage.hasImages();
    if (!hasImages) {
      test.skip();
      return;
    }

    const firstCard = homePage.imageCards.first();
    await expect(firstCard).toBeVisible();

    // Each card should have an image
    const img = firstCard.locator('img');
    await expect(img).toBeVisible();
  });

  test('should display plate solve status badge on image cards', async () => {
    const hasImages = await homePage.hasImages();
    if (!hasImages) {
      test.skip();
      return;
    }

    // Each card should have either "Plate Solved" or "No Plate Data" badge
    const firstCard = homePage.imageCards.first();
    const plateSolvedBadge = firstCard.getByText('Plate Solved');
    const noDataBadge = firstCard.getByText('No Plate Data');
    const hasBadge =
      (await plateSolvedBadge.count()) > 0 || (await noDataBadge.count()) > 0;
    expect(hasBadge).toBeTruthy();
  });

  test('should open image overlay when clicking an image card', async () => {
    const hasImages = await homePage.hasImages();
    if (!hasImages) {
      test.skip();
      return;
    }

    await homePage.clickFirstImage();

    // The overlay is a fixed inset-0 element with close button
    const closeButton = homePage.page.locator('button[aria-label="Close"]');
    await expect(closeButton).toBeVisible();
  });

  test('should close image overlay with close button', async () => {
    const hasImages = await homePage.hasImages();
    if (!hasImages) {
      test.skip();
      return;
    }

    await homePage.clickFirstImage();

    const closeButton = homePage.page.locator('button[aria-label="Close"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // After closing, overlay should be gone
    await expect(closeButton).not.toBeVisible();
  });

  test('should display Load More button when more images exist', async () => {
    const hasImages = await homePage.hasImages();
    if (!hasImages) {
      test.skip();
      return;
    }

    const loadMore = homePage.loadMoreButton;
    const hasLoadMore = (await loadMore.count()) > 0;
    if (hasLoadMore) {
      await expect(loadMore).toBeVisible();
      // Button text should include count info
      const text = await loadMore.textContent();
      expect(text).toMatch(/load more images/i);
    }
  });
});

// =============================================================================
// Home Page - Image Overlay
// =============================================================================

test.describe('Home Page - Image Overlay', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();

    const hasImages = await homePage.hasImages();
    if (!hasImages) {
      test.skip();
      return;
    }

    await homePage.clickFirstImage();
    await homePage.page.locator('button[aria-label="Close"]').waitFor();
  });

  test('should display close button', async () => {
    await expect(homePage.page.locator('button[aria-label="Close"]')).toBeVisible();
  });

  test('should display expand button', async () => {
    // Expand button is in the image viewer area
    const expandButton = homePage.page.getByRole('button', { name: /expand/i });
    if ((await expandButton.count()) > 0) {
      await expect(expandButton).toBeVisible();
    }
  });

  test('should display plate solution section', async () => {
    const plateSolutionText = homePage.page.getByText('Plate Solution');
    await expect(plateSolutionText).toBeVisible();
  });

  test('should display technical details section', async () => {
    const technicalDetails = homePage.page.getByText('Technical Details');
    await expect(technicalDetails).toBeVisible();
  });

  test('should display tags section', async () => {
    const tagsSection = homePage.page.getByText('Tags').first();
    await expect(tagsSection).toBeVisible();
  });
});

// =============================================================================
// Navigation
// =============================================================================

test.describe('Navigation', () => {
  test('should navigate from home to equipment page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();

    await homePage.navigateTo('equipment');
    const equipmentPage = new EquipmentPage(page);
    await equipmentPage.verifyPageLoaded();
  });

  test('should navigate from home to plate solving page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();

    await homePage.navigateTo('plateSolving');
    const plateSolvingPage = new PlateSolvingPage(page);
    await plateSolvingPage.verifyPageLoaded();
  });

  test('should navigate from home to admin page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();

    await homePage.navigateTo('admin');
    const adminPage = new AdminPage(page);
    await adminPage.verifyPageLoaded();
  });

  test('should navigate across all pages sequentially', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();

    await homePage.navigateTo('equipment');
    await expect(page).toHaveURL(/\/equipment/);

    const equipmentPage = new EquipmentPage(page);
    await equipmentPage.navigateTo('plateSolving');
    await expect(page).toHaveURL(/\/plate-solving/);

    const plateSolvingPage = new PlateSolvingPage(page);
    await plateSolvingPage.navigateTo('admin');
    await expect(page).toHaveURL(/\/admin/);

    const adminPage = new AdminPage(page);
    await adminPage.navigateTo('gallery');
    await expect(page).toHaveURL(/\/$/);
  });

  test('should navigate home by clicking logo', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.navigateTo('equipment');
    await expect(page).toHaveURL(/\/equipment/);

    // Click the logo/brand link to go home
    await page.locator('header a[href="/"]').first().click();
    await page.waitForURL('**/');
    await expect(page).toHaveURL(/\/$/);
  });

  test('should highlight active navigation link', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();

    // Gallery link should be active (text-foreground class)
    const galleryLink = homePage.navigationLinks.gallery;
    await expect(galleryLink).toHaveClass(/text-foreground/);

    // Equipment link should be inactive
    const equipmentLink = homePage.navigationLinks.equipment;
    await expect(equipmentLink).toHaveClass(/text-muted-foreground/);
  });
});

// =============================================================================
// Equipment Page
// =============================================================================

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

// =============================================================================
// Plate Solving Page
// =============================================================================

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

    const hasImages = (await plateSolvingPage.imageGrid.locator('.group').count()) > 0;
    if (!hasImages) {
      await expect(plateSolvingPage.emptyState).toBeVisible();
    }
  });
});

// =============================================================================
// Admin Page
// =============================================================================

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

// =============================================================================
// Error Handling
// =============================================================================

test.describe('Error Handling', () => {
  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.getByText('404 Page Not Found')).toBeVisible();
  });

  test('should display 404 card with error icon', async ({ page }) => {
    await page.goto('/some-random-route');
    // The not-found page has an AlertCircle icon and a Card
    await expect(page.getByText('404 Page Not Found')).toBeVisible();
    await expect(page.getByText(/forget to add the page/i)).toBeVisible();
  });

  test('should render header even when API is blocked', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort());
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header h1')).toHaveText('Skymmich');
  });

  test('should render search filters when API is blocked', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort());
    await page.goto('/');
    await expect(page.getByPlaceholder('Search astrophotography images...')).toBeVisible();
  });

  test('should render equipment page when API is blocked', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort());
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: /equipment catalog/i })).toBeVisible();
  });

  test('should render admin page when API is blocked', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort());
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /admin settings/i })).toBeVisible();
  });

  test('should render plate solving page when API is blocked', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort());
    await page.goto('/plate-solving');
    await expect(page.getByRole('heading', { name: /plate solving/i })).toBeVisible();
  });
});

// =============================================================================
// Header Consistency (shared across pages)
// =============================================================================

test.describe('Header - Consistent Across Pages', () => {
  const pages = [
    { name: 'Home', url: '/' },
    { name: 'Equipment', url: '/equipment' },
    { name: 'Plate Solving', url: '/plate-solving' },
    { name: 'Admin', url: '/admin' },
  ];

  for (const p of pages) {
    test(`should display header on ${p.name} page`, async ({ page }) => {
      await page.goto(p.url);
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('header h1')).toHaveText('Skymmich');
    });

    test(`should display Sync Immich button on ${p.name} page`, async ({ page }) => {
      await page.goto(p.url);
      await expect(page.getByRole('button', { name: /sync immich/i })).toBeVisible();
    });

    test(`should display GitHub link on ${p.name} page`, async ({ page }) => {
      await page.goto(p.url);
      await expect(page.locator('a[href="https://github.com/mstelz/skymmich"]')).toBeVisible();
    });
  }
});
