
import { flattenJSON } from './lib/parsers/flattener';

const data = [
    {
        "id": 101,
        "name": "Wireless Headphones",
        "price": 99.99,
        "inStock": true,
        "tags": ["audio", "bluetooth", "sale"]
    },
    {
        "id": 102,
        "name": "USB-C Cable",
        "price": 12.50,
        "inStock": false,
        "tags": ["accessory", "charging"]
    },
    {
        "id": 103,
        "name": "Smart Watch",
        "price": 199.00,
        "inStock": true,
        "tags": ["wearable", "tech"]
    }
];

const result = flattenJSON(data, { mode: 'relational' });
console.log('Mode: relational');
console.log('Num rows:', result.rows.length);
if (result.rows.length > 0) {
    console.log('Schema:', result.schema);
    console.log('Row 1 keys:', Object.keys(result.rows[0]));
    console.log('Row 1:', result.rows[0]);
}
