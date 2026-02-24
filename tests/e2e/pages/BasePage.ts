import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly navigationLinks: {
    gallery: Locator;
    equipment: Locator;
    plateSolving: Locator;
    admin: Locator;
  };
  readonly syncButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.navigationLinks = {
      gallery: page.getByRole('link', { name: /gallery/i }),
      equipment: page.getByRole('link', { name: /equipment/i }),
      plateSolving: page.getByRole('link', { name: /plate solving/i }),
      admin: page.locator('header a[href="/admin"]'),
    };
    this.syncButton = page.getByRole('button', { name: /sync immich/i });
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async navigateTo(section: 'gallery' | 'equipment' | 'plateSolving' | 'admin') {
    await this.navigationLinks[section].click();

    const expectedUrls: Record<string, string> = {
      gallery: '/',
      equipment: '/equipment',
      plateSolving: '/plate-solving',
      admin: '/admin',
    };

    await this.page.waitForURL(`**${expectedUrls[section]}`);
  }
}
