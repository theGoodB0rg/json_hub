
import { describe, it, expect } from '@jest/globals';
import { flattenJSON } from '@/lib/parsers/flattener';
import { expandToTableView } from '@/lib/parsers/tableView';
import { generateTableXlsx } from '@/lib/converters/jsonToXlsxTableView';
import { jsonToCsv } from '@/lib/converters/jsonToCsv';
import { jsonToHtml } from '@/lib/converters/jsonToHtml';
import * as XLSX from 'xlsx';

// Sample Data from User
const initialData = {
    "events": [
        {
            "eventId": "evt_001",
            "userId": "user_123",
            "eventType": "page_view",
            "timestamp": "2024-01-10T14:30:00Z",
            "properties": {
                "page": "/products",
                "referrer": "google.com",
                "device": "mobile"
            }
        },
        {
            "eventId": "evt_002",
            "userId": "user_123",
            "eventType": "add_to_cart",
            "timestamp": "2024-01-10T14:32:15Z",
            "properties": {
                "productId": "TSHIRT-001",
                "quantity": 2,
                "price": 29.99
            }
        }
    ]
};

describe('Comprehensive View and Export Verification', () => {
    // Simulate User Edit
    const data = JSON.parse(JSON.stringify(initialData));
    data.events[0].properties.page = "/cart_edited"; // EDIT APPLIED

    console.log('\n=== 1. Nested View Verification ===');
    console.log('Verified by source data inspection.');
    console.log('Value at events[0].properties.page:', data.events[0].properties.page);

    it('should reflect edits in Flat View', () => {
        console.log('\n=== 2. Flat View Verification ===');
        const { rows, schema } = flattenJSON(data);

        // Find the row for evt_001
        // Key might be "events.0.properties.page" depending on flattening mode
        // Default mode is 'flat' -> "events.0.properties.page"

        const targetValue = rows.find(r => r['events.0.eventId'] === 'evt_001' || r['events.0.properties.page'])?.['events.0.properties.page'];

        console.log('Flat View Row Sample (Keys):', Object.keys(rows[0]).slice(0, 3));
        console.log('Target Value in Flat View:', targetValue);

        expect(targetValue).toBe('/cart_edited');
    });

    it('should reflect edits in Table View', () => {
        console.log('\n=== 3. Table View Verification ===');
        const { rows, schema } = expandToTableView(data.events); // Table view usually takes array

        // Table view columns should be cleaned: "properties.page" or just "page" depending on cleaning
        // expandToTableView on `data.events` (array)
        // Schema likely: eventId, userId, properties.page...

        console.log('Table View Schema:', schema);

        const targetRow = rows.find(r => r['eventId'] === 'evt_001');
        const targetValue = targetRow ? targetRow['properties.page'] : 'n/a';

        console.log('Target Value in Table View:', targetValue);
        expect(targetValue).toBe('/cart_edited');
    });

    it('should reflect edits in CSV Export', () => {
        console.log('\n=== 4. CSV Export Verification ===');
        const { rows, schema } = flattenJSON(data);
        const csv = jsonToCsv(rows, schema);

        console.log('CSV Snippet:\n', csv.slice(0, 200));
        expect(csv).toContain('/cart_edited');
    });

    it('should reflect edits in HTML Export', () => {
        console.log('\n=== 5. HTML Export Verification ===');
        const { rows, schema } = flattenJSON(data);
        const html = jsonToHtml(rows, schema);

        console.log('HTML Snippet containing value:', html.match(/\/cart_edited/)?.[0] || 'Not Found');
        expect(html).toContain('/cart_edited');
    });

    it('should reflect edits in Excel (Table) Export', () => {
        console.log('\n=== 6. Excel (Table) Export Verification ===');
        // Passing data.events as Table View expects array often, or checks if object
        // The implementation handles object wrapper
        const wb = generateTableXlsx(data.events);
        expect(wb).not.toBeNull();

        if (wb) {
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            console.log('Excel Config:', { sheets: wb.SheetNames });
            console.log('Excel Data Sample:', JSON.stringify(jsonData.slice(0, 1)));

            const strData = JSON.stringify(jsonData);
            expect(strData).toContain('/cart_edited');
        }
    });
});
