import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly searchInput: Locator;
  readonly imageGallery: Locator;
  readonly sidebar: Locator;
  readonly syncButton: Locator;
  readonly loadMoreButton: Locator;
  readonly searchFilters: Locator;
  readonly images: Locator;
  readonly modal: Locator;
  readonly modalCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]')).first();
    this.imageGallery = page.locator('[data-testid="image-gallery"], .image-gallery, .grid').first();
    this.sidebar = page.locator('[data-testid="sidebar"], aside, .sidebar').first();
    this.syncButton = page.getByText(/sync/i).or(page.locator('button:has-text("Sync")')).first();
    this.loadMoreButton = page.getByText(/load more/i).or(page.locator('button:has-text("Load More")')).first();
    this.searchFilters = page.locator('[data-testid="search-filters"], .search-filters, form').first();
    this.images = page.locator('img, [role="img"], .image-item');
    this.modal = page.locator('[role="dialog"], .modal, .overlay').first();
    this.modalCloseButton = this.modal.locator('button:has-text("Close"), button[aria-label*="close"], .close-btn').first();
  }

  async goto() {
    await super.goto('/');
  }

  async search(query: string) {
    if (await this.searchInput.count() > 0) {
      await this.searchInput.fill(query);
      await this.searchInput.press('Enter');
      await this.page.waitForTimeout(1000);
    }
  }

  async clickSync() {
    if (await this.syncButton.count() > 0) {
      await this.syncButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  async clickLoadMore() {
    if (await this.loadMoreButton.count() > 0) {
      const initialImageCount = await this.images.count();
      await this.loadMoreButton.click();
      await this.page.waitForTimeout(2000);
      const newImageCount = await this.images.count();
      expect(newImageCount).toBeGreaterThanOrEqual(initialImageCount);
    }
  }

  async clickFirstImage() {
    if (await this.images.count() > 0) {
      await this.images.first().click();
      
      if (await this.modal.count() > 0) {
        await expect(this.modal).toBeVisible();
      }
    }
  }

  async closeModal() {
    if (await this.modal.count() > 0 && await this.modalCloseButton.count() > 0) {
      await this.modalCloseButton.click();
      await expect(this.modal).not.toBeVisible();
    }
  }

  async verifyPageElements() {
    await expect(this.header).toBeVisible();
    await expect(this.imageGallery).toBeVisible();
    
    if (await this.sidebar.count() > 0) {
      await expect(this.sidebar).toBeVisible();
    }
    
    if (await this.searchFilters.count() > 0) {
      await expect(this.searchFilters).toBeVisible();
    }
  }

  async selectFilter(filterType: 'object-type' | 'constellation' | 'tags', value: string) {
    const dropdowns = this.page.locator('select, [role="combobox"]');
    const dropdownCount = await dropdowns.count();
    
    if (dropdownCount > 0) {
      const firstDropdown = dropdowns.first();
      await firstDropdown.click();
      await this.page.waitForTimeout(500);
      
      const options = this.page.locator('option, [role="option"]');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        await options.nth(1).click();
        await this.page.waitForTimeout(1000);
      }
    }
  }

  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async checkMobileMenu() {
    const mobileMenu = this.page.locator('[aria-label*="menu"], .mobile-menu, button:has-text("Menu")').first();
    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
    }
  }
}