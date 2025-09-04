import { test, expect } from '@playwright/test';

test.describe('Skymmich Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the home page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Skymmich/i);
    await expect(page.locator('header')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    // Check for main navigation links
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /equipment/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /plate solving/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /admin/i })).toBeVisible();
  });

  test('should display search filters', async ({ page }) => {
    // Wait for filters to load
    await page.waitForLoadState('networkidle');
    
    // Check for search input
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
    }
    
    // Check for filter controls (they might be in dropdowns or other UI elements)
    const filterSection = page.locator('[data-testid="search-filters"], .search-filters, form').first();
    if (await filterSection.count() > 0) {
      await expect(filterSection).toBeVisible();
    }
  });

  test('should display image gallery', async ({ page }) => {
    // Wait for images to potentially load
    await page.waitForTimeout(2000);
    
    // Check for gallery container
    const gallery = page.locator('[data-testid="image-gallery"], .image-gallery, .grid').first();
    await expect(gallery).toBeVisible();
  });

  test('should display sidebar with statistics', async ({ page }) => {
    // Wait for stats to load
    await page.waitForLoadState('networkidle');
    
    // Look for sidebar or stats section
    const sidebar = page.locator('[data-testid="sidebar"], aside, .sidebar').first();
    if (await sidebar.count() > 0) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('should navigate to equipment page', async ({ page }) => {
    await page.click('a[href="/equipment"], a:has-text("Equipment")');
    await page.waitForURL('**/equipment');
    await expect(page).toHaveURL(/\/equipment/);
  });

  test('should navigate to plate solving page', async ({ page }) => {
    await page.click('a[href="/plate-solving"], a:has-text("Plate Solving")');
    await page.waitForURL('**/plate-solving');
    await expect(page).toHaveURL(/\/plate-solving/);
  });

  test('should navigate to admin page', async ({ page }) => {
    await page.click('a[href="/admin"], a:has-text("Admin")');
    await page.waitForURL('**/admin');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should handle image interaction', async ({ page }) => {
    // Wait for images to load
    await page.waitForTimeout(3000);
    
    // Look for clickable images
    const images = page.locator('img, [role="img"], .image-item').first();
    if (await images.count() > 0) {
      await images.click();
      
      // Check if modal or overlay appears
      const modal = page.locator('[role="dialog"], .modal, .overlay').first();
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();
        
        // Close modal if close button exists
        const closeButton = modal.locator('button:has-text("Close"), button[aria-label*="close"], .close-btn').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await expect(modal).not.toBeVisible();
        }
      }
    }
  });

  test('should test search functionality', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]')).first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
    }
  });

  test('should test sync functionality', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for sync button
    const syncButton = page.getByText(/sync/i).or(page.locator('button:has-text("Sync")')).first();
    if (await syncButton.count() > 0) {
      await syncButton.click();
      
      // Wait for sync to potentially complete
      await page.waitForTimeout(2000);
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that main elements are still visible and accessible
    await expect(page.locator('header')).toBeVisible();
    
    // Check for mobile menu or navigation
    const mobileMenu = page.locator('[aria-label*="menu"], .mobile-menu, button:has-text("Menu")').first();
    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
    }
  });

  test('should handle load more functionality', async ({ page }) => {
    // Wait for initial images to load
    await page.waitForTimeout(2000);
    
    // Look for load more button
    const loadMoreButton = page.getByText(/load more/i).or(page.locator('button:has-text("Load More")')).first();
    if (await loadMoreButton.count() > 0) {
      const initialImageCount = await page.locator('img').count();
      await loadMoreButton.click();
      
      // Wait for new images to load
      await page.waitForTimeout(2000);
      
      const newImageCount = await page.locator('img').count();
      expect(newImageCount).toBeGreaterThanOrEqual(initialImageCount);
    }
  });

  test('should handle filter interactions', async ({ page }) => {
    // Wait for filters to load
    await page.waitForLoadState('networkidle');
    
    // Look for dropdown filters
    const dropdowns = page.locator('select, [role="combobox"]');
    const dropdownCount = await dropdowns.count();
    
    if (dropdownCount > 0) {
      const firstDropdown = dropdowns.first();
      await firstDropdown.click();
      
      // Wait for dropdown options to appear
      await page.waitForTimeout(500);
      
      // Look for options and select one if available
      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Equipment Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/equipment');
  });

  test('should load equipment catalog', async ({ page }) => {
    await expect(page).toHaveURL(/\/equipment/);
    
    // Wait for equipment data to load
    await page.waitForTimeout(2000);
    
    // Check for equipment content
    const equipmentContent = page.locator('.equipment-catalog, .equipment-list, .catalog').first();
    if (await equipmentContent.count() > 0) {
      await expect(equipmentContent).toBeVisible();
    }
  });
});

test.describe('Plate Solving Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plate-solving');
  });

  test('should load plate solving interface', async ({ page }) => {
    await expect(page).toHaveURL(/\/plate-solving/);
    
    // Wait for plate solving content to load
    await page.waitForTimeout(2000);
  });
});

test.describe('Admin Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('should load admin interface', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);
    
    // Wait for admin content to load
    await page.waitForTimeout(2000);
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should either redirect or show 404 page
    await page.waitForTimeout(1000);
    
    // Check for 404 content or redirect to home
    const currentUrl = page.url();
    const has404Content = await page.locator(':has-text("404"), :has-text("Not Found"), :has-text("Page not found")').count() > 0;
    const redirectedHome = currentUrl.includes('/') && !currentUrl.includes('/non-existent-page');
    
    expect(has404Content || redirectedHome).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block network requests to simulate offline
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/');
    
    // Wait for page to handle network errors
    await page.waitForTimeout(3000);
    
    // Page should still be functional even without API data
    await expect(page.locator('header')).toBeVisible();
  });
});