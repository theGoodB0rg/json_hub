import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\26fbe21d-53c1-4f90-aeee-67c1bf9add71';

test.describe('Visual QA & UI Inspection', () => {
    test('Inspect Directory Page & Search', async ({ page }) => {
        await page.goto('/converters');
        await page.waitForLoadState('networkidle');

        // Screenshot 1: Directory Overview
        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_directory_overview.png'),
            fullPage: true,
        });

        // Test Category Filter Tab: CRM
        const crmTab = page.locator('button:has-text("CRM & Sales")');
        if (await crmTab.isVisible()) {
            await crmTab.click({ force: true });
            await page.waitForTimeout(300);
            await page.screenshot({
                path: path.join(ARTIFACT_DIR, 'qa_directory_crm_filter.png'),
            });
        }

        // Test Live Search Filter: Type "stripe"
        const searchInput = page.locator('input[placeholder*="Search 35+ formats"]');
        await searchInput.fill('stripe');
        await page.waitForTimeout(300);
        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_directory_search_stripe.png'),
        });
    });

    test('Inspect Platform Converter Page (Stripe to Excel)', async ({ page }) => {
        await page.goto('/converters/stripe-json-to-excel');
        await page.waitForLoadState('networkidle');

        // Screenshot 2: Stripe Converter Header & Hero
        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_stripe_page.png'),
            fullPage: true,
        });
    });

    test('Inspect Homepage & Header Dropdown', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Open Converters MegaMenu Dropdown in Header
        const convertersDropdown = page.locator('button:has-text("Converters")');
        if (await convertersDropdown.isVisible()) {
            await convertersDropdown.click({ force: true });
            await page.waitForTimeout(400);
            await page.screenshot({
                path: path.join(ARTIFACT_DIR, 'qa_header_dropdown.png'),
            });
        }

        // Homepage Full View
        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_homepage_full.png'),
            fullPage: true,
        });
    });

    test('Inspect Format Matrix Page (CSV to JSON)', async ({ page }) => {
        await page.goto('/csv-to-json');
        await page.waitForLoadState('networkidle');

        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_csv_to_json.png'),
            fullPage: true,
        });
    });
});
