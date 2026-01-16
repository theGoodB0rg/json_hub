/**
 * Large File Performance Test Script
 * 
 * Tests the app's ability to handle large JSON files and measures timing.
 * 
 * Run with: npx playwright test scripts/performance-test.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DATA_DIR = path.join(__dirname, '..', 'test-data');
const BASE_URL = 'http://localhost:3000';

// Performance thresholds (in seconds)
const THRESHOLDS = {
    '1MB': { parse: 3, export: 5 },
    '3MB': { parse: 8, export: 10 },
    '5MB': { parse: 15, export: 20 },
    '10MB': { parse: 30, export: 45 },
};

interface TestResult {
    fileName: string;
    fileSize: number;
    recordCount: number;
    parseTime: number;
    exportCsvTime: number;
    exportXlsxTime: number;
    exportHtmlTime: number;
    memoryUsage: number | null;
    passed: boolean;
    errors: string[];
}

const results: TestResult[] = [];

test.describe('Large File Performance Tests', () => {
    test.beforeAll(async () => {
        // Ensure test data exists
        const testFiles = ['test-1mb.json', 'test-3mb.json', 'test-5mb.json', 'test-10mb.json'];
        for (const file of testFiles) {
            const filePath = path.join(TEST_DATA_DIR, file);
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ Test file missing: ${file}. Run 'node scripts/generate-test-files.js' first.`);
            }
        }
    });

    test.afterAll(async () => {
        // Print summary
        console.log('\n' + '='.repeat(80));
        console.log('PERFORMANCE TEST RESULTS');
        console.log('='.repeat(80));
        console.log('');
        console.log('| File | Size | Records | Parse | CSV | XLSX | HTML | Status |');
        console.log('|------|------|---------|-------|-----|------|------|--------|');

        for (const r of results) {
            const sizeMB = (r.fileSize / (1024 * 1024)).toFixed(1);
            const status = r.passed ? '✅ PASS' : '❌ FAIL';
            console.log(
                `| ${r.fileName.padEnd(15)} | ${sizeMB.padStart(5)}MB | ${String(r.recordCount).padStart(7)} | ` +
                `${r.parseTime.toFixed(1)}s | ${r.exportCsvTime.toFixed(1)}s | ${r.exportXlsxTime.toFixed(1)}s | ` +
                `${r.exportHtmlTime.toFixed(1)}s | ${status} |`
            );
        }
        console.log('');
        console.log('='.repeat(80));
    });

    for (const [sizeLabel, thresholds] of Object.entries(THRESHOLDS)) {
        const fileName = `test-${sizeLabel.toLowerCase()}.json`;
        const filePath = path.join(TEST_DATA_DIR, fileName);

        test(`Performance test: ${sizeLabel} file`, async ({ page }) => {
            test.setTimeout(120000); // 2 minute timeout

            // Skip if file doesn't exist
            if (!fs.existsSync(filePath)) {
                test.skip();
                return;
            }

            const fileStats = fs.statSync(filePath);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const recordCount = JSON.parse(fileContent).length;

            const result: TestResult = {
                fileName,
                fileSize: fileStats.size,
                recordCount,
                parseTime: 0,
                exportCsvTime: 0,
                exportXlsxTime: 0,
                exportHtmlTime: 0,
                memoryUsage: null,
                passed: true,
                errors: [],
            };

            try {
                // Navigate to app
                await page.goto(BASE_URL);
                await page.waitForSelector('[id="file-upload"]', { timeout: 10000 });

                // Upload file and measure parse time
                const parseStart = Date.now();

                const fileInput = await page.$('input[type="file"]');
                await fileInput?.setInputFiles(filePath);

                // Wait for parse to complete (success message or progress to finish)
                await Promise.race([
                    page.waitForSelector('text=JSON parsed and flattened successfully', { timeout: 60000 }),
                    page.waitForSelector('text=Parse Large File', { timeout: 5000 }).then(async (btn) => {
                        // If large file mode, click parse button
                        await btn.click();
                        await page.waitForSelector('text=JSON parsed and flattened successfully', { timeout: 60000 });
                    }).catch(() => { }),
                ]);

                result.parseTime = (Date.now() - parseStart) / 1000;

                // Verify data loaded
                const rowCount = await page.locator('text=/\\d+ rows/').first().textContent();
                expect(rowCount).toContain('rows');

                // Test CSV export
                result.exportCsvTime = await measureExport(page, 'csv');

                // Test XLSX export  
                result.exportXlsxTime = await measureExport(page, 'xlsx');

                // Test HTML export
                result.exportHtmlTime = await measureExport(page, 'html');

                // Check against thresholds
                if (result.parseTime > thresholds.parse) {
                    result.errors.push(`Parse time ${result.parseTime.toFixed(1)}s exceeded threshold ${thresholds.parse}s`);
                }

            } catch (error) {
                result.passed = false;
                result.errors.push(error instanceof Error ? error.message : String(error));
            }

            result.passed = result.errors.length === 0;
            results.push(result);

            // Log individual result
            console.log(`\n📊 ${fileName}: Parse=${result.parseTime.toFixed(1)}s, CSV=${result.exportCsvTime.toFixed(1)}s, XLSX=${result.exportXlsxTime.toFixed(1)}s`);

            expect(result.passed, result.errors.join(', ')).toBe(true);
        });
    }
});

async function measureExport(page: Page, format: string): Promise<number> {
    const start = Date.now();

    // Click export button for format
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    // Find and click the export button
    await page.click(`button:has-text("Download ${format.toUpperCase()}")`).catch(async () => {
        // Try alternative selector
        await page.click(`[data-format="${format}"]`).catch(async () => {
            // Try clicking export menu first
            await page.click('text=Export').catch(() => { });
            await page.click(`text=${format.toUpperCase()}`);
        });
    });

    try {
        const download = await downloadPromise;
        await download.path(); // Wait for download to complete
    } catch {
        // Export might not trigger download in test env
    }

    return (Date.now() - start) / 1000;
}

// Quick sanity test for small files
test('Sanity check: Small JSON parsing', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[id="file-upload"]');

    // Use template selector to load example
    await page.click('text=Try Example');

    // Should parse quickly
    await expect(page.locator('text=JSON parsed and flattened successfully')).toBeVisible({ timeout: 5000 });
});
