import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\a7f8f69a-7489-4e0d-bccf-05e9646659df\\screenshots';

async function main() {
    console.log('🚀 Launching isolated browser validation against live site...');
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    const browser = await chromium.launch({
        channel: 'msedge',
        headless: true,
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    const telemetryRequests: Array<{ url: string; body: any }> = [];

    page.on('request', req => {
        if (req.url().includes('/api/telemetry')) {
            try {
                const postData = req.postData();
                if (postData) {
                    telemetryRequests.push({ url: req.url(), body: JSON.parse(postData) });
                    console.log('📡 [Telemetry Intercepted]:', req.url(), postData);
                }
            } catch {
                // ignore
            }
        }
    });

    // ---------------------------------------------------------
    // TEST 1: Initial Sample Mount (isSample must be true)
    // ---------------------------------------------------------
    console.log('\n--- [TEST 1] Visiting live converter page with initial sample ---');
    await page.goto('https://jsonexport.com/converters/trello-json-to-csv', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const isSampleOnMount = await page.evaluate(() => {
        return (window as any).__APP_STORE__?.getState()?.isSample;
    });

    console.log(`[TEST 1 Result] __APP_STORE__.getState().isSample on mount: ${isSampleOnMount}`);

    const screenshot1Path = path.join(SCREENSHOTS_DIR, 'validation_initial_sample_is_sample_true.png');
    await page.screenshot({ path: screenshot1Path });
    console.log(`📸 Screenshot saved: ${screenshot1Path}`);

    if (isSampleOnMount !== true) {
        throw new Error(`Expected isSample to be true on mount with initialSample, got: ${isSampleOnMount}`);
    }

    // ---------------------------------------------------------
    // TEST 2: Real User Typing / Dropping Data (isSample must be false)
    // ---------------------------------------------------------
    console.log('\n--- [TEST 2] Simulating real user inputting custom JSON ---');
    const customUserJson = JSON.stringify([
        { customer_id: "CUST-999", name: "Alice Wonderland", order_total: 249.99, status: "completed" },
        { customer_id: "CUST-1000", name: "Bob Builder", order_total: 120.00, status: "pending" }
    ], null, 2);

    await page.evaluate((customData) => {
        const store = (window as any).__APP_STORE__;
        store.getState().setRawInput(customData);
        store.getState().parseInput();
    }, customUserJson);

    await page.waitForTimeout(1000);

    const isSampleAfterUserEdit = await page.evaluate(() => {
        return (window as any).__APP_STORE__?.getState()?.isSample;
    });

    console.log(`[TEST 2 Result] __APP_STORE__.getState().isSample after user paste: ${isSampleAfterUserEdit}`);

    const screenshot2Path = path.join(SCREENSHOTS_DIR, 'validation_user_custom_data_is_sample_false.png');
    await page.screenshot({ path: screenshot2Path });
    console.log(`📸 Screenshot saved: ${screenshot2Path}`);

    if (isSampleAfterUserEdit !== false) {
        throw new Error(`Expected isSample to be false after user paste, got: ${isSampleAfterUserEdit}`);
    }

    // ---------------------------------------------------------
    // TEST 3: User Export Telemetry with is_sample: false
    // ---------------------------------------------------------
    console.log('\n--- [TEST 3] Triggering export to verify export_success telemetry ---');
    await page.evaluate(() => {
        const store = (window as any).__APP_STORE__;
        return store.getState().exportData('csv');
    });

    await page.waitForTimeout(2000);

    const screenshot3Path = path.join(SCREENSHOTS_DIR, 'validation_user_export_completed.png');
    await page.screenshot({ path: screenshot3Path });
    console.log(`📸 Screenshot saved: ${screenshot3Path}`);

    const storedConversionEvents = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('jsonexport:conversion-events') || '[]');
    });

    console.log(`\n📋 Locally recorded conversion events (${storedConversionEvents.length} events):`);
    for (const ev of storedConversionEvents) {
        console.log(`  • Event: ${ev.name} | is_sample: ${ev.payload?.is_sample}`);
    }

    const exportEvent = storedConversionEvents.find((e: any) => e.name === 'export_success');
    if (!exportEvent) {
        throw new Error('export_success event was not found in storedConversionEvents!');
    }

    if (exportEvent.payload?.is_sample !== false) {
        throw new Error(`Expected export_success to have is_sample: false, got: ${exportEvent.payload?.is_sample}`);
    }

    console.log('\n✅ ALL LIVE BROWSER TESTS PASSED!');
    await browser.close();
}

main().catch(err => {
    console.error('❌ Validation failed:', err);
    process.exit(1);
});
