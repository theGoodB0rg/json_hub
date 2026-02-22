import { expect, test } from '@playwright/test';

const telemetryStorageKey = 'jsonexport:conversion-events';

test.beforeEach(async ({ page }) => {
    await page.addInitScript((storageKey) => {
        window.localStorage.removeItem(storageKey);
    }, telemetryStorageKey);
});

test('utm_source renders growth banner and tracks campaign source', async ({ page }) => {
    await page.goto('/?utm_source=producthunt');

    await expect(page.locator('[data-testid="growth-source-banner"]')).toBeVisible();
    await expect(page.getByText(/Welcome, Product Hunt community/i)).toBeVisible();

    const eventNames = await page.evaluate((storageKey) => {
        const raw = window.localStorage.getItem(storageKey);
        const events = raw ? JSON.parse(raw) : [];
        return events.map((event: { name: string }) => event.name);
    }, telemetryStorageKey);

    expect(eventNames).toContain('campaign_source_detected');
});

