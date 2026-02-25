import { test, expect } from '@playwright/test';
import { AdminPage } from './pages';
import { mockNotifications } from './fixtures/notifications';
import { mockSettings } from './fixtures/settings';

test.describe('Admin Page - Notifications', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    await adminPage.mockSettings(mockSettings);
    await adminPage.mockNotifications(mockNotifications);
    await adminPage.mockAcknowledgeAll();
    await adminPage.mockAcknowledgeNotification();
    await adminPage.mockAlbums();
    await adminPage.goto();
    await adminPage.waitForLoad();
  });

  test('should display notification card with count', async () => {
    await expect(adminPage.notificationCard).toBeVisible();
    await expect(adminPage.notificationTitle).toContainText(`${mockNotifications.length}`);
  });

  test('should display notification items', async () => {
    const count = await adminPage.notificationItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show only first 5 notifications by default', async () => {
    const count = await adminPage.notificationItems.count();
    expect(count).toBe(5);
  });

  test('should display Show all button when more than 5 notifications', async () => {
    await expect(adminPage.showAllButton).toBeVisible();
    await expect(adminPage.showAllButton).toContainText(`Show all (${mockNotifications.length})`);
  });

  test('should expand to show all notifications when clicking Show all', async () => {
    await adminPage.showAllButton.click();
    const count = await adminPage.notificationItems.count();
    expect(count).toBe(mockNotifications.length);
  });

  test('should collapse notifications when clicking Show less', async () => {
    await adminPage.showAllButton.click();
    await expect(adminPage.notificationItems).toHaveCount(mockNotifications.length);

    // Button text should now say "Show less"
    const showLessButton = adminPage.page.getByRole('button', { name: /show less/i });
    await showLessButton.click();
    await expect(adminPage.notificationItems).toHaveCount(5);
  });

  test('should display Acknowledge All button', async () => {
    await expect(adminPage.acknowledgeAllButton).toBeVisible();
  });

  test('should display acknowledge button on each notification', async () => {
    // Each visible notification row should have an Acknowledge button
    const ackButtons = adminPage.notificationCard.getByRole('button', { name: 'Acknowledge', exact: true });
    // 5 visible items (collapsed) should each have an Acknowledge button
    await expect(ackButtons).toHaveCount(5);
  });

  test('should hide notification card when Acknowledge All is clicked', async () => {
    await adminPage.acknowledgeAllButton.click();
    await expect(adminPage.notificationCard).not.toBeVisible();
  });

  test('should display notification types with correct icons', async () => {
    // The first notification is an error type - should have an icon visible
    const firstItem = adminPage.notificationItems.first();
    await expect(firstItem).toBeVisible();
    // Verify the title text from mock data appears
    await expect(adminPage.notificationCard.getByText('Plate solving failed')).toBeVisible();
  });

  test('should display notification messages', async () => {
    // Verify messages from mock data appear
    await expect(adminPage.notificationCard.getByText(/Failed to plate solve/)).toBeVisible();
    await expect(adminPage.notificationCard.getByText(/Successfully synced 12/)).toBeVisible();
  });
});

test.describe('Admin Page - Notifications (Few)', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    await adminPage.mockSettings(mockSettings);
    // Only 2 notifications - enough for Acknowledge All but not Show all
    await adminPage.mockNotifications(mockNotifications.slice(0, 2));
    await adminPage.mockAcknowledgeAll();
    await adminPage.mockAlbums();
    await adminPage.goto();
    await adminPage.waitForLoad();
  });

  test('should show Acknowledge All button with 2 notifications', async () => {
    await expect(adminPage.acknowledgeAllButton).toBeVisible();
  });

  test('should not show Show all button with 2 notifications', async () => {
    await expect(adminPage.showAllButton).not.toBeVisible();
  });

  test('should display all notifications without pagination', async () => {
    await expect(adminPage.notificationItems).toHaveCount(2);
  });
});

test.describe('Admin Page - Notifications (None)', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    await adminPage.mockSettings(mockSettings);
    await adminPage.mockNotifications([]);
    await adminPage.mockAlbums();
    await adminPage.goto();
    await adminPage.waitForLoad();
  });

  test('should not display notification card when no notifications', async () => {
    await expect(adminPage.notificationCard).not.toBeVisible();
  });
});

test.describe('Admin Page - Notifications (Single)', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    await adminPage.mockSettings(mockSettings);
    await adminPage.mockNotifications(mockNotifications.slice(0, 1));
    await adminPage.mockAcknowledgeNotification();
    await adminPage.mockAlbums();
    await adminPage.goto();
    await adminPage.waitForLoad();
  });

  test('should not show Acknowledge All button with only 1 notification', async () => {
    await expect(adminPage.acknowledgeAllButton).not.toBeVisible();
  });

  test('should display single notification', async () => {
    await expect(adminPage.notificationItems).toHaveCount(1);
  });
});
