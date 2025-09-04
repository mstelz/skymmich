import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly navigationLinks: {
    home: Locator;
    equipment: Locator;
    plateSolving: Locator;
    admin: Locator;
  };

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.navigationLinks = {
      home: page.getByRole('link', { name: /home/i }),
      equipment: page.getByRole('link', { name: /equipment/i }),
      plateSolving: page.getByRole('link', { name: /plate solving/i }),
      admin: page.getByRole('link', { name: /admin/i }),
    };
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async navigateTo(section: 'home' | 'equipment' | 'plateSolving' | 'admin') {
    await this.navigationLinks[section].click();
    
    const expectedUrls = {
      home: '/',
      equipment: '/equipment',
      plateSolving: '/plate-solving',
      admin: '/admin'
    };
    
    await this.page.waitForURL(`**${expectedUrls[section]}`);
  }
}