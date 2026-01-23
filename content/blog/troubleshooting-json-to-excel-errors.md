---
title: "Troubleshooting JSON to Excel: How to Fix Common Errors (2026)"
date: "2026-01-23"
description: "Fix common JSON to Excel errors like '[object Object]', 'DataFormat.Error', and corruption issues. A technical troubleshooting guide for developers and analysts."
keywords: ["json to excel not working", "fix object object excel", "flatten nested json error", "excel json import error", "convert json error"]
---

You have a JSON file. You need an Excel file. It should be simple, but suddenly you're staring at an error message or a spreadsheet filled with `[object Object]`.

Converting data formats is rarely as clean as it looks in tutorials. Real-world data is messy, nested, and broken.

I've helped thousands of users debug their JSON conversions. Here is the **authoritative troubleshooting guide** for the most common errors when moving from JSON to Excel.

---

## Error 1: The infamous `[object Object]`

**Symptoms:**
Your Excel file opens, but entire columns just say `[object Object]` instead of the actual data.

**The Cause:**
Excel (and basic CSV converters) are flat 2D grids. JSON is 3D (nested).
If you have a JSON object like `{"customer": {"name": "Alice", "id": 1}}`, a dumb converter tries to shove that entire `"customer"` object into one cell. It fails and prints the JavaScript string representation: `[object Object]`.

**The Fix:**
You need a tool that supports **flattening**.
1.  **Stop** using "Save as CSV" in your code editors.
2.  **Use** [JsonExport](https://jsonexport.com). It automatically detects these objects and expands them into columns: `customer.name` and `customer.id`.

---

## Error 2: `DataFormat.Error: We reached the end of the buffer` (Power Query)

**Symptoms:**
You try to import JSON using Excel's "Get Data" (Power Query), and it crashes with a cryptic buffer or parsing error.

**The Cause:**
The file is likely:
1.  **Too large:** Power Query struggles with JSON files >10MB in memory.
2.  **Invalid JSON:** The file might be truncated or have a trailing comma.

**The Fix:**
1.  **Validate the JSON:** Use a linter (or paste the first few lines into a validator) to ensure the syntax is valid.
2.  **Use a different parser:** If Power Query is crashing on size, try a streaming parser. [JsonExport](https://jsonexport.com) runs client-side and can generally handle larger files (up to ~100MB) because it doesn't have the overhead of Excel's UI.

---

## Error 3: "My dates are random numbers"

**Symptoms:**
You see dates like `45321` instead of `2026-01-23`.

**The Cause:**
Excel stores dates as "serial numbers" (days since Jan 1, 1900). Sometimes, converters misinterpret strings as numbers or vice versa.

**The Fix:**
In Excel:
1.  Select the column.
2.  Right-click > **Format Cells**.
3.  Choose **Date**.

*Pro Tip:* To avoid this entirely, ensure your JSON date strings are ISO-8601 format (`YYYY-MM-DD`).

---

## Error 4: "Rows are missing"

**Symptoms:**
The JSON file has 1,000 items, but your Excel file only has 800.

**The Cause:**
**Inconsistent Schema.** In NoSQL (JSON), not every record needs to have the same fields.
*   Record 1: `{"id": 1, "name": "A"}`
*   Record 2: `{"id": 2, "error": "failed"}`

If your converter determines the "columns" based only on the first record, it will create an `id` and `name` column. When it hits Record 2, it drops the `error` data because there is no column for it, or worse, drops the row entirely.

**The Fix:**
Use a converter that scans the **entire dataset** to build the header row before processing. (Yes, we built JsonExport to do exactly this).

---

## Summary Checklist

If your conversion is failing, run this 5-second diagnostic:

1.  **Is it valid JSON?** (Check for closing braces `}`).
2.  **Is it nested?** (If yes, you need a flattener, not a basic converter).
3.  **Is it huge?** (If >50MB, use Python or a robust client-side tool).
4.  **Are you using the right tool?**

Don't fight with `[object Object]`. It's a solved problem.
