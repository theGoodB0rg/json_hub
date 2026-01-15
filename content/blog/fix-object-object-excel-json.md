---
title: "How to Fix '[object Object]' in Excel When Importing JSON (2026 Guide)"
date: "2026-01-16"
description: "Fix the frustrating [object Object] error when importing JSON to Excel. 3 proven methods + step-by-step tutorial. No coding required."
keywords: ["object object excel", "json to excel error", "nested json excel", "fix json excel import", "json shows object object"]
---

You open your JSON file in Excel, only to see **`[object Object]`** everywhere instead of your actual data.

Frustrating, right?

This happens to thousands of data analysts every day. You're not alone, and it's not your fault.

## Why Does Excel Show [object Object]?

The `[object Object]` error appears when Excel tries to display **nested JSON objects** but can't flatten them automatically.

### Example: The Problem

Here's a simple JSON file:

```json
{
  "orders": [
    {
      "id": "ORD-001",
      "customer": {
        "name": "Sarah Johnson",
        "email": "sarah@example.com"
      },
      "total": 299.99
    }
  ]
}
```

When you open this in Excel using "Get Data → From JSON", the `customer` column shows **`[object Object]`** instead of the actual name and email.

**Why?** Because `customer` is a **nested object** (an object inside an object), and Excel doesn't know how to display it in a flat table cell.

### Common Scenarios Where This Happens

1. **API Exports** – Salesforce, HubSpot, Stripe all return nested JSON
2. **Database Exports** – MongoDB, PostgreSQL JSONB columns
3. **Google Analytics** – GA4 API responses have deeply nested structures
4. **Survey Tools** – Typeform, SurveyMonkey export nested answer arrays
5. **E-commerce Platforms** – Shopify orders with nested line items

If you've seen `[object Object]`, you're dealing with **nested JSON** that Excel can't handle natively.

---

## Method 1: Excel Power Query (For Advanced Users)

**Difficulty:** Hard  
**Best For:** Users comfortable with Excel's M language  
**Time:** 10-15 minutes per file

### Steps:

1. **Open Excel** → Data tab → Get Data → From File → From JSON
2. **Select your JSON file**
3. Excel opens **Power Query Editor**
4. Find the column showing `[object Object]`
5. **Click the expand icon** (two arrows) next to the column header
6. **Select which fields** to expand (e.g., `name`, `email`)
7. Click **OK**
8. Repeat for each nested object
9. Click **Close & Load** to import to Excel

### Problems with This Method:

❌ **Learning curve:** Power Query M language is complex  
❌ **Repetitive:** You must manually expand each nested level  
❌ **Breaks easily:** Small JSON structure changes require re-doing everything  
❌ **Time-consuming:** 10-15 minutes for complex JSON

**Verdict:** Good if you're already a Power Query expert, but overkill for most data analysts.

---

## Method 2: Python + Pandas (For Programmers)

**Difficulty:** Hard  
**Best For:** Data scientists comfortable with Python  
**Time:** 5-10 minutes to write script

### Steps:

1. **Install Python and Pandas**
   ```bash
   pip install pandas openpyxl
   ```

2. **Write a Python script:**
   ```python
   import pandas as pd
   import json

   # Load JSON file
   with open('data.json', 'r') as f:
       data = json.load(f)

   # Flatten nested structure
   df = pd.json_normalize(data['orders'])

   # Export to Excel
   df.to_excel('output.xlsx', index=False)
   ```

3. **Run the script**
4. Open `output.xlsx`

### Problems with This Method:

❌ **Requires coding skills:** Not everyone knows Python  
❌ **Setup time:** Installing Python, libraries, learning syntax  
❌ **Not reusable:** Each JSON structure needs a new script  
❌ **Overkill:** Too complex for simple one-time conversions

**Verdict:** Excellent if you're already a Python developer, but unrealistic for most business/data analysts.

---

## Method 3: JsonExport (Easiest & Fastest)

**Difficulty:** Easy  
**Best For:** Anyone who needs quick results without coding  
**Time:** 30 seconds

### Why This Works:

JsonExport automatically detects nested objects and flattens them using **dot notation**. The `customer` object becomes separate columns: `customer.name` and `customer.email`.

**No manual expansion. No coding. No Power Query.**

### Step-by-Step Tutorial:

#### Step 1: Go to [JsonExport.com](https://jsonexport.com)

No signup required. 100% free.

#### Step 2: Upload Your JSON File

- **Click "Upload File"** or drag-and-drop
- Or **paste JSON text** directly into the editor

#### Step 3: Preview the Data

You'll immediately see a **clean table preview**. No `[object Object]` errors.

**How?** JsonExport's Smart Flattener automatically:
- Detects nested objects
- Converts them to flat columns (`customer.name`, `customer.email`)
- Preserves your data structure

#### Step 4: Choose View Mode (Optional)

Three options:

1. **Flat View** – All data in one table with dot notation
   - `customer.name`, `customer.email` as separate columns
   - Best for simple analysis

2. **Table View** – Perfect for spreadsheets
   - Similar to Flat but optimized for Excel pivot tables

3. **Nested View** – Parent-child relationships
   - Shows hierarchical data (e.g., Order → Line Items)
   - Best for complex nested arrays

For most use cases, **Flat View** or **Table View** works perfectly.

#### Step 5: Download as Excel

Click **"Download Excel (XLSX)"** button.

Done. Your Excel file is ready with **no `[object Object]` errors**.

---

## Real-World Example: Fixing Salesforce JSON

### The Problem:

You export Salesforce Contacts. The JSON looks like this:

```json
{
  "records": [
    {
      "Id": "003xx000004TmiQ",
      "Name": "John Smith",
      "Account": {
        "Name": "Acme Corp",
        "Industry": "Technology"
      },
      "Email": "john@acme.com"
    }
  ]
}
```

### What Happens in Excel:

| Id | Name | Account | Email |
|----|------|---------|-------|
| 003xx000004TmiQ | John Smith | **[object Object]** | john@acme.com |

### After Using JsonExport:

| Id | Name | Account.Name | Account.Industry | Email |
|----|------|--------------|------------------|-------|
| 003xx000004TmiQ | John Smith | Acme Corp | Technology | john@acme.com |

Perfect! Now you can analyze by `Account.Industry` or filter by `Account.Name`.

---

## Comparison: Which Method Should You Use?

| Method | Time | Difficulty | Best For |
|--------|------|------------|----------|
| **Power Query** | 10-15 min | Hard | Power Query experts |
| **Python/Pandas** | 5-10 min | Hard | Python developers |
| **JsonExport** | 30 sec | Easy | Everyone else ✅ |

---

## Advanced: Handling Multiple Levels of Nesting

Some JSON files have **3+ levels** of nesting:

```json
{
  "user": {
    "profile": {
      "address": {
        "city": "New York",
        "zip": "10001"
      }
    }
  }
}
```

**Result in Excel:** `user.profile.address.city`, `user.profile.address.zip`

JsonExport handles this automatically. Power Query requires **manual expansion at each level** (very tedious).

---

## FAQ

### Q: Can I use this for large JSON files?

**A:** Yes! JsonExport handles files **50MB+** without issues. Most online converters cap at 5-10MB.

### Q: Is my data secure?

**A:** Absolutely. JsonExport processes everything **100% client-side** in your browser. Your data never touches our servers. Perfect for sensitive financial or healthcare data.

### Q: What if I have nested arrays (not just objects)?

**A:** Arrays are handled differently:
- **Flat View:** Arrays are expanded into multiple columns (`item.0`, `item.1`, etc.)
- **Nested View:** Arrays create separate child tables (better for parent-child relationships)

### Q: Does this work with double-encoded JSON?

**A:** Yes! If your JSON is double-encoded (e.g., `"{\"name\":\"John\"}"` as a string), JsonExport's **Auto-Unescape** feature detects and fixes it automatically.

### Q: Can I undo changes?

**A:** Yes. JsonExport has full **undo/redo history** (Ctrl+Z / Ctrl+Y).

---

## Conclusion: Stop Fighting with `[object Object]`

The `[object Object]` error happens because Excel can't natively handle nested JSON. You have three options:

1. **Power Query** – Complex, time-consuming, requires expertise
2. **Python** – Requires programming skills
3. **JsonExport** – 30 seconds, no coding, handles all edge cases

For 95% of data analysts, **JsonExport is the fastest solution**.

[Try JsonExport Now (Free Forever)](https://jsonexport.com)

---

**Related Guides:**
- [5 Ways to Convert JSON to Excel (Ranked by Ease)](/blog/5-ways-convert-json-to-excel-ranked)
- [JSON to Excel for Weekly Reports](/blog/json-to-excel-weekly-reports-automation)
- [Best Tool for Large JSON Files](/blog/best-tool-large-json-files-excel)
