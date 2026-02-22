---
title: "Why Shopify Line Items Break in Excel (And How to Fix It Instantly)"
date: "2026-02-22"
description: "Stop spending hours writing Python scripts to parse Shopify order exports. Here is the operational guide to flattening nested line_items directly into Excel."
---

If you manage e-commerce operations on Shopify, at some point you've likely exported your orders via the REST API or Webhooks. But when you try to open that JSON export in Excel, it usually looks like a disaster.

Instead of clear rows for each product a customer bought, you open Excel and see a single column labeled `line_items` completely filled with completely useless `[object Object]` text. 

Why does this happen, and more importantly, how do you fix it without learning Python or relying on an expensive developer?

## The Root Cause: Nested Arrays
Shopify's architecture stores an "Order" as the top-level object. But because an order can contain multiple products, those products are stored as a **nested array** inside the `line_items` property. 

When you convert a Shopify JSON file directly to CSV or Excel using basic tools, they don't know how to handle lists inside of rows. So, they just print the JavaScript object notation equivalent: `[object Object]`.

## The Traditional (And Slow) Fix
Typically, RevOps and E-commerce managers have two bad choices:
1. **Pay for an expensive ETL tool** like Fivetran or Make.com just for a one-off report.
2. **Beg an engineer** to write a Python script using the pandas library `.json_normalize()` function to explode the data.

## The Instant, Free Fix (100% Client-Side)

We built [JsonExport](https://jsonexport.com) specifically so operations teams never have to write another line of code to fix this. JsonExport's parsers are designed to automatically detect nested arrays like Shopify's `line_items` and flatten them perfectly into distinct rows.

### How to use it:
1. **Export your data:** Get your raw Shopify Orders JSON export.
2. **Drop it in:** Navigate to our specialized [Shopify JSON to Excel Converter](https://jsonexport.com/converters/shopify-json-to-excel).
3. **Instant Diagnosis:** The tool analyzes your file entirely in your browser window (no data is uploaded to our servers, keeping your customer PII perfectly safe).
4. **Download your perfect Excel file:** The tool will automatically explode the `line_items` array so that each product has its own row, while duplicating the parent order data (like the Customer Email and Total Price) alongside it.

### Testing your pipeline?
If you're building a new integration and just need data to test, don't use real production data. Grab our [Free Mock Shopify Orders JSON Dataset](https://jsonexport.com/test-data/shopify-line-items-json) from our dummy data honeypot. It contains incredibly complex, nested `line_items` payloads designed specifically to break bad parsers.
