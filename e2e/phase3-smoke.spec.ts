import { expect, test } from '@playwright/test';
import path from 'path';

const telemetryStorageKey = 'jsonexport:conversion-events';
const fixturePath = path.resolve(__dirname, '..', 'tests', 'fixtures', 'mixed_empty_arrays.json');

test.beforeEach(async ({ page }) => {
    await page.addInitScript((storageKey) => {
        window.localStorage.removeItem(storageKey);
        window.localStorage.setItem(
            'json-hub-settings',
            JSON.stringify({
                state: {
                    viewMode: 'flat',
                    prettyPrint: true,
                    exportSettings: {
                        structure: 'flat',
                        askForPreference: false,
                    },
                },
                version: 0,
            })
        );
    }, telemetryStorageKey);
});

test('home page parses uploaded JSON and exposes export controls', async ({ page }) => {
    await page.goto('/');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(fixturePath);
    await expect(page.getByText(/JSON parsed and flattened successfully/)).toBeVisible({ timeout: 15000 });

    const parseEventNames = await page.evaluate((storageKey) => {
        const raw = window.localStorage.getItem(storageKey);
        const events = raw ? JSON.parse(raw) : [];
        return events.map((event: { name: string }) => event.name);
    }, telemetryStorageKey);

    expect(parseEventNames).toContain('parse_success');
    await expect(page.locator('[data-testid="export-download-button"]')).toBeVisible();
});

test('converter page parses uploaded JSON successfully', async ({ page }) => {
    await page.goto('/converters/stripe-json-to-excel');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(fixturePath);
    await expect(page.getByText(/JSON parsed and flattened successfully/)).toBeVisible({ timeout: 15000 });
});

test('test-data page CTA routes to converter page', async ({ page }) => {
    await page.goto('/test-data/complex-nested-json-example');
    await page.locator('[data-testid="test-data-repair-cta"]').click();
    await expect(page).toHaveURL(/\/converters\/nested-arrays-to-excel$/);
});
