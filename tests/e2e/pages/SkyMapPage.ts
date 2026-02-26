import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SkyMapPage extends BasePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly aladinContainer: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;
  readonly scriptError: Locator;
  readonly popupCard: Locator;
  readonly popupCloseButton: Locator;
  readonly popupTitle: Locator;
  readonly popupViewLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /sky map/i, level: 1 });
    this.subtitle = page.locator('main p.text-muted-foreground').first();
    this.aladinContainer = page.locator('#aladin-container');
    this.loadingSpinner = page.locator('.animate-spin');
    this.emptyState = page.getByText(/no plate-solved images to display/i);
    this.scriptError = page.getByText(/failed to load sky atlas/i);
    this.popupCard = page.locator('main .absolute.top-4.right-4');
    this.popupCloseButton = this.popupCard.getByRole('button');
    this.popupTitle = this.popupCard.locator('h3');
    this.popupViewLink = this.popupCard.getByRole('link', { name: /view in gallery/i });
  }

  async goto() {
    await super.goto('/sky-map');
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/sky-map/);
    await expect(this.heading).toBeVisible();
  }

  async mockMarkersResponse(markers: any[]) {
    await this.page.route('**/api/sky-map/markers', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(markers),
      })
    );
  }

  async mockMarkersError() {
    await this.page.route('**/api/sky-map/markers', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server error' }),
      })
    );
  }
}
