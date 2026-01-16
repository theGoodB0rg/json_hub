/**
 * Generate test JSON files of various sizes for performance testing
 * Run with: node scripts/generate-test-files.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'test-data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate a realistic e-commerce order object
 */
function generateOrder(id) {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const countries = ['USA', 'UK', 'Germany', 'France', 'Japan', 'Australia', 'Canada'];
    const products = ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Camera', 'Watch', 'Speaker'];

    return {
        orderId: `ORD-${String(id).padStart(8, '0')}`,
        customer: {
            id: `CUST-${Math.floor(Math.random() * 100000)}`,
            name: `Customer ${id}`,
            email: `customer${id}@example.com`,
            phone: `+1-555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
            address: {
                street: `${Math.floor(Math.random() * 9999)} Main Street`,
                city: `City ${Math.floor(Math.random() * 1000)}`,
                state: `State ${Math.floor(Math.random() * 50)}`,
                zipCode: String(Math.floor(Math.random() * 99999)).padStart(5, '0'),
                country: countries[Math.floor(Math.random() * countries.length)]
            }
        },
        items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
            productId: `PROD-${Math.floor(Math.random() * 10000)}`,
            name: products[Math.floor(Math.random() * products.length)],
            quantity: Math.floor(Math.random() * 5) + 1,
            price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
            sku: `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        })),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            source: 'web',
            campaign: Math.random() > 0.5 ? `CAMP-${Math.floor(Math.random() * 100)}` : null,
            notes: Math.random() > 0.7 ? `Note for order ${id}` : null
        }
    };
}

/**
 * Generate JSON file of approximately the target size
 */
function generateFile(targetSizeMB, filename) {
    const targetBytes = targetSizeMB * 1024 * 1024;
    const orders = [];
    let currentSize = 2; // Start with "[]" brackets
    let id = 1;

    console.log(`Generating ${filename} (target: ${targetSizeMB}MB)...`);

    // Estimate: each order is roughly 800-1200 bytes
    while (currentSize < targetBytes) {
        const order = generateOrder(id++);
        const orderStr = JSON.stringify(order);
        currentSize += orderStr.length + 1; // +1 for comma
        orders.push(order);

        // Progress indicator every 1000 orders
        if (id % 5000 === 0) {
            const progress = ((currentSize / targetBytes) * 100).toFixed(1);
            process.stdout.write(`\r  Progress: ${progress}% (${orders.length} records)`);
        }
    }

    const json = JSON.stringify(orders, null, 2);
    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, json);

    const actualSize = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
    console.log(`\n  ✓ Created ${filename}: ${actualSize}MB, ${orders.length} records\n`);

    return { filename, sizeMB: parseFloat(actualSize), records: orders.length };
}

// Generate test files
console.log('\n🔧 Generating test JSON files for performance testing...\n');

const results = [
    generateFile(1, 'test-1mb.json'),
    generateFile(3, 'test-3mb.json'),
    generateFile(5, 'test-5mb.json'),
    generateFile(10, 'test-10mb.json'),
];

// Summary
console.log('📊 Summary:');
console.log('─'.repeat(50));
results.forEach(r => {
    console.log(`  ${r.filename.padEnd(20)} ${String(r.sizeMB).padStart(6)}MB  ${String(r.records).padStart(8)} records`);
});
console.log('─'.repeat(50));
console.log(`\n✅ Files saved to: ${OUTPUT_DIR}\n`);
