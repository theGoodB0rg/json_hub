
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'test-data');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

const generateItem = (id: number) => ({
    orderId: `ORD-${String(id).padStart(8, '0')}`,
    customer: {
        id: `CUST-${Math.floor(Math.random() * 100000)}`,
        name: `Customer ${id}`,
        email: `customer${id}@example.com`,
        phone: `+1-555-${Math.floor(Math.random() * 1000000)}`,
        address: {
            street: `${Math.floor(Math.random() * 9999)} Main Street`,
            city: `City ${Math.floor(Math.random() * 1000)}`,
            state: `State ${Math.floor(Math.random() * 50)}`,
            zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
            country: Math.random() > 0.5 ? 'USA' : 'UK'
        }
    },
    items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
        productId: `PROD-${Math.floor(Math.random() * 10000)}`,
        name: ['Widget', 'Gadget', 'Tool', 'Device'][Math.floor(Math.random() * 4)],
        quantity: Math.floor(Math.random() * 10) + 1,
        price: parseFloat((Math.random() * 100).toFixed(2))
    })),
    status: ['pending', 'shipped', 'delivered', 'cancelled'][Math.floor(Math.random() * 4)],
    createdAt: new Date().toISOString()
});

function generateFile(targetSizeMB: number, filename: string) {
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    const stream = fs.createWriteStream(path.join(OUTPUT_DIR, filename));

    stream.write('[\n');

    let currentSize = 2; // '[' + '\n'
    let id = 1;
    let first = true;

    console.log(`Generating ${filename} (~${targetSizeMB}MB)...`);

    while (currentSize < targetSizeBytes) {
        const item = generateItem(id++);
        const itemStr = (first ? '  ' : ',\n  ') + JSON.stringify(item);

        stream.write(itemStr);
        currentSize += Buffer.byteLength(itemStr);
        first = false;

        if (id % 100000 === 0) process.stdout.write('.');
    }

    stream.write('\n]');
    stream.end();
    console.log(`\nDone! Created ${filename} with ${id} records.`);
}

// Generate 50MB and 500MB files
// generateFile(50, 'test-50mb.json');
generateFile(500, 'test-500mb.json');
