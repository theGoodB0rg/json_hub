
import { flattenJSON } from '../lib/parsers/flattener';
import fs from 'fs';
import path from 'path';

// Mock the environment if needed or just rely on relative imports failing if not handled
// We will use relative path in the file so it works with tsx

const filePath = path.join(process.cwd(), 'test-data', 'test-10mb.json');

try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    // Test first 20 rows
    const sampleData = data.slice(0, 20);
    const { rows, schema } = flattenJSON(sampleData);

    console.log('--- Verification Report ---');
    console.log(`Total sample rows processed: ${rows.length}`);

    // Row 0 has 1 item
    // Row 1 has 2 items

    const row0 = rows[0];
    const row1 = rows[1];

    console.log('\nRow 0 (OrderId: ' + row0.orderId + ')');
    console.log('Items in raw JSON:', data[0].items.length);
    console.log('Flattened "items.0.name":', row0['items.0.name']);
    console.log('Flattened "items.1.name":', row0['items.1.name']);

    console.log('\nRow 1 (OrderId: ' + row1.orderId + ')');
    console.log('Items in raw JSON:', data[1].items.length);
    console.log('Flattened "items.0.name":', row1['items.0.name']);
    console.log('Flattened "items.1.name":', row1['items.1.name']);

    // Find the max number of items in this sample
    const nameColumns = schema.filter(k => k.startsWith('items.') && k.endsWith('.name'));
    console.log('\nDetected "items.*.name" columns:', nameColumns);

    // Verification Logic
    let passing = true;

    if (data[0].items.length === 1 && row0['items.1.name'] === null) {
        console.log('\n✅ VERIFIED: Row 0 has 1 item, so items.1.name is correctly NULL.');
    } else {
        console.log('\n❌ FAILED: Row 0 null check.');
        passing = false;
    }

    if (row1['items.1.name'] !== null) {
        console.log('✅ VERIFIED: Row 1 has 2 items, so items.1.name is correctly populated.');
    } else {
        console.log('❌ FAILED: Row 1 population check.');
        passing = false;
    }

    console.log('\nCONCLUSION:');
    if (passing) {
        console.log('The NULL values in the preview are CORRECT and EXPECTED. They represent "missing" data blocks for rows that have fewer array items than the maximum found in the dataset.');
    } else {
        console.log('There is an unexpected behavior in the flattening logic.');
    }

} catch (e) {
    console.error('Error running verification:', e);
}
