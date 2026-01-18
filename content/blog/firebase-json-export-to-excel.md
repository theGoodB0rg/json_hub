---
title: "Firebase JSON Export to Excel: Firestore and Realtime Database Guide"
date: "2026-01-18"
description: "Export Firebase Firestore and Realtime Database to Excel. Handle nested documents, subcollections, and deeply structured NoSQL data."
keywords: ["firebase export to excel", "firestore to excel", "firebase json export", "export firestore data", "firebase realtime database excel"]
---

Firebase stores data in ways that don't map cleanly to spreadsheets. Nested documents, subcollections, arrays of objects—the NoSQL flexibility that makes Firebase great for apps becomes a nightmare when you need a flat Excel file.

The Firebase Console has an export button. It produces JSON that Excel can't open directly. And even if it could, the nesting would make your data unusable.

Here's how to actually get Firebase data into Excel in a format you can analyze.

## Firebase Data Structure (The Problem)

Firestore example:
```json
{
  "users": {
    "user_001": {
      "name": "Alice Chen",
      "email": "alice@company.com",
      "profile": {
        "department": "Engineering",
        "title": "Senior Developer",
        "startDate": "2023-06-15"
      },
      "projects": ["proj_001", "proj_002", "proj_003"],
      "permissions": {
        "admin": false,
        "canEdit": true,
        "canDelete": false
      }
    }
  }
}
```

Try opening that in Excel. You get one cell with all that text. Or worse, Excel interprets it as corrupted data.

## Method 1: Firebase Console Export → JSON → Excel

**For Firestore:**

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select your project
3. Firestore Database → ⋮ (three dots) → Export
4. Create a Cloud Storage bucket for the export
5. Wait for export to complete (minutes to hours depending on size)
6. Download the `.json` files from Cloud Storage

**For Realtime Database:**

1. Same console
2. Realtime Database → ⋮ → Export JSON
3. Downloads immediately as `.json` file

**The problem:** You now have raw JSON. Excel can't use it.

**The solution:** Paste the JSON into [JsonExport](https://jsonexport.com). It:

1. Flattens nested objects: `profile.department`, `profile.title`
2. Expands arrays: `projects[0]`, `projects[1]`, `projects[2]`
3. Unwraps nested objects in arrays
4. Exports as Excel with proper columns

## Method 2: Firebase Admin SDK (Programmatic)

For larger exports or automation:

**Node.js setup:**

```bash
npm install firebase-admin
```

**Initialize:**

```javascript
const admin = require('firebase-admin');
const fs = require('fs');

// Download service account key from Firebase Console
const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://YOUR_PROJECT.firebaseio.com'
});

const db = admin.firestore();
```

**Export a collection:**

```javascript
async function exportCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  
  const data = [];
  snapshot.forEach(doc => {
    data.push({
      _id: doc.id,
      ...doc.data()
    });
  });
  
  fs.writeFileSync(
    `${collectionName}.json`, 
    JSON.stringify(data, null, 2)
  );
  
  console.log(`Exported ${data.length} documents`);
}

exportCollection('users');
```

**Result:** A JSON file you can convert to Excel.

## Handling Subcollections

Firestore subcollections don't export automatically.

**Structure:**
```
users/
  user_001/
    name: "Alice"
    orders/           ← subcollection
      order_001/
        amount: 150
      order_002/
        amount: 300
```

**Export with subcollections:**

```javascript
async function exportWithSubcollections(collectionName, subCollectionName) {
  const snapshot = await db.collection(collectionName).get();
  
  const data = [];
  
  for (const doc of snapshot.docs) {
    const parentData = { _id: doc.id, ...doc.data() };
    
    // Fetch subcollection
    const subSnapshot = await doc.ref.collection(subCollectionName).get();
    parentData[subCollectionName] = subSnapshot.docs.map(sub => ({
      _id: sub.id,
      ...sub.data()
    }));
    
    data.push(parentData);
  }
  
  fs.writeFileSync(`${collectionName}_with_${subCollectionName}.json`, 
    JSON.stringify(data, null, 2)
  );
}

exportWithSubcollections('users', 'orders');
```

**Result:**
```json
[{
  "_id": "user_001",
  "name": "Alice",
  "orders": [
    {"_id": "order_001", "amount": 150},
    {"_id": "order_002", "amount": 300}
  ]
}]
```

Convert to Excel—each order becomes its own columns: `orders[0].amount`, `orders[1].amount`, etc.

**Alternative:** Export as separate tables (like relational):
- `users.json` with user data
- `orders.json` with `userId` field
- Join in Excel with VLOOKUP

## Realtime Database vs Firestore

**Realtime Database:**
- One giant JSON tree
- Console export gives you everything
- Easier to work with (one file)
- But can be huge if you have lots of data

**Firestore:**
- Documents and collections
- Subcollections don't export with parents
- Must export collection by collection
- Better for selective exports

## Filtering Before Export

Don't export everything if you only need recent data:

**Firestore query:**
```javascript
const snapshot = await db.collection('orders')
  .where('createdAt', '>=', new Date('2026-01-01'))
  .where('status', '==', 'completed')
  .get();
```

**Realtime Database query:**
```javascript
const ref = admin.database().ref('orders');
const snapshot = await ref
  .orderByChild('createdAt')
  .startAt('2026-01-01')
  .once('value');
```

Export only what you need—faster and smaller files.

## Handling Firebase Data Types

Firebase has types that don't exist in Excel:

| Firebase Type | Export Format | Excel Handling |
|--------------|---------------|----------------|
| String | String | Works |
| Number | Number | Works |
| Boolean | true/false | Excel TRUE/FALSE |
| Timestamp | ISO string or object | Date format needed |
| GeoPoint | `{lat, lng}` object | Split into columns |
| Reference | Document path | String |
| Array | JSON array | Flatten to columns |
| Map | Nested object | Flatten with dot notation |

**Timestamps are tricky:**

Firestore returns timestamps as objects:
```json
{"createdAt": {"_seconds": 1705600000, "_nanoseconds": 0}}
```

Convert before export:
```javascript
data.createdAt = doc.data().createdAt.toDate().toISOString();
```

Or let JsonExport handle it—it detects `_seconds` and converts automatically.

## Large Exports (100K+ Documents)

For massive collections:

**Problem 1: Memory**

Loading 500K documents into memory crashes Node.js.

**Solution: Streaming**

```javascript
const stream = fs.createWriteStream('large_export.json');
stream.write('[\n');

let first = true;
let lastDoc = null;
const batchSize = 1000;

while (true) {
  let query = db.collection('events').limit(batchSize);
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  const snapshot = await query.get();
  if (snapshot.empty) break;
  
  snapshot.forEach(doc => {
    if (!first) stream.write(',\n');
    stream.write(JSON.stringify({_id: doc.id, ...doc.data()}));
    first = false;
  });
  
  lastDoc = snapshot.docs[snapshot.docs.length - 1];
  console.log(`Exported ${batchSize} more...`);
}

stream.write('\n]');
stream.end();
```

**Problem 2: Export time**

500K documents takes 10+ minutes to query.

**Solution:** Export during off-peak hours. Use Cloud Functions with Pub/Sub trigger for scheduled exports.

## Security Rules Don't Apply to Admin SDK

Your Firestore security rules block client reads. But the Admin SDK bypasses rules entirely.

**This means:**
- You can export any data in the database
- No authentication needed (service account handles it)
- Be careful with what you export

**For client-side exports (not recommended):**
- Must follow security rules
- Requires user authentication
- Limited by rules, not practical for bulk export

Use Admin SDK for exports. Always.

## Common Export Scenarios

### Analytics Dashboard Data

**Goal:** Weekly active users, page views, events.

**Firestore structure:**
```
analytics/
  2026-01/
    pageViews: 150000
    uniqueUsers: 12500
    events/
      signup: 450
      purchase: 123
```

**Export:**
```javascript
const docs = await db.collection('analytics').get();
const data = docs.docs.map(d => ({
  month: d.id,
  ...d.data()
}));
```

### User Data for GDPR Request

**Goal:** Export all data for one user.

```javascript
async function exportUserData(userId) {
  // Main user doc
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = {user: userDoc.data()};
  
  // User's orders
  const orders = await db.collection('orders')
    .where('userId', '==', userId).get();
  userData.orders = orders.docs.map(d => d.data());
  
  // User's activity
  const activity = await db.collection('activity')
    .where('userId', '==', userId).get();
  userData.activity = activity.docs.map(d => d.data());
  
  return userData;
}
```

### E-commerce Order History

**Goal:** All orders with customer info for accountant.

```javascript
const orders = await db.collection('orders')
  .where('createdAt', '>=', startOfQuarter)
  .where('createdAt', '<', endOfQuarter)
  .get();

// Enrich with customer names
const customerIds = [...new Set(orders.docs.map(d => d.data().customerId))];
const customers = await Promise.all(
  customerIds.map(id => db.collection('customers').doc(id).get())
);
const customerMap = Object.fromEntries(
  customers.map(c => [c.id, c.data().name])
);

const enrichedOrders = orders.docs.map(d => ({
  ...d.data(),
  customerName: customerMap[d.data().customerId]
}));
```

## Automating Weekly Exports

**Option 1: Cloud Functions + Cloud Scheduler**

```javascript
// functions/index.js
exports.weeklyExport = functions.pubsub
  .schedule('every monday 06:00')
  .onRun(async () => {
    const data = await exportCollection('orders');
    await uploadToStorage(data, `exports/orders-${Date.now()}.json`);
    await sendEmail('team@company.com', 'Weekly export ready');
  });
```

**Option 2: Local cron job**

```bash
# crontab -e
0 6 * * 1 /usr/local/bin/node /path/to/export-script.js
```

**Option 3: GitHub Actions**

```yaml
name: Weekly Firebase Export
on:
  schedule:
    - cron: '0 6 * * 1'
jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: node export.js
        env:
          FIREBASE_KEY: ${{ secrets.FIREBASE_KEY }}
```

## Troubleshooting

### "PERMISSION_DENIED"

Your service account doesn't have Firestore access.

**Fix:** Go to Google Cloud Console → IAM → Add role "Cloud Datastore User" to your service account.

### "Export file is empty"

Collection name is wrong, or collection has no documents.

**Check:** Console → Firestore → verify collection exists and has data.

### "Timestamps show as objects"

Firebase Timestamp type exports as `{_seconds, _nanoseconds}`.

**Fix:** Convert before export:
```javascript
doc.data().createdAt.toDate().toISOString()
```

Or let JsonExport detect and convert automatically.

### "Nested data too deep"

You have objects inside arrays inside objects.

**Fix:** JsonExport flattens up to 10 levels deep. For deeper nesting, pre-process your JSON to flatten specific fields.

## Privacy and Security

Firebase often contains user PII:
- Names, emails, phone numbers
- User-generated content
- Payment information

**When exporting:**
- Only export what you need
- Delete exports after use
- Don't email sensitive exports (use secure sharing)

**JsonExport advantage:**
- Runs in your browser
- JSON never leaves your machine
- No cloud processing of your Firebase data

## Summary

**Small exports:** Firebase Console → JSON → JsonExport → Excel

**Large exports:** Admin SDK script → JSON → JsonExport → Excel

**Recurring exports:** Cloud Functions or cron job → automated weekly

Firebase's flexibility comes with export complexity. But once you have the JSON, conversion to Excel is straightforward.

[Convert Your Firebase JSON Export](https://jsonexport.com) - Automatically flatten nested documents and subcollections.

---

**Related Guides:**
- [Notion Export to Excel Complete Guide](/blog/notion-export-excel-complete-guide)
- [Airtable Export to Excel Complete Guide](/blog/airtable-export-excel-complete-guide)
