---
title: "JSON Data Analysis in Excel: Complete Guide for Data Analysts (2026)"
date: "2026-01-16"
description: "Transform messy JSON API data into Excel reports without coding. Perfect for data analysts who need to analyze JSON from Salesforce, HubSpot, or Google Analytics."
keywords: ["json data analysis", "json to excel for analysts", "business intelligence json", "analyze json data", "json reporting", "data cleaning json"]
---

You're a data analyst. Your job is turning data into insights, not fighting with file formats.

But increasingly, the data you need is locked in JSON files:
- **Salesforce** exports contacts as JSON
- **Google Analytics 4** API returns JSON
- **HubSpot** deals and companies come in JSON
- **Survey tools** (Typeform, SurveyMonkey) export JSON

Your manager asks: "What's our customer acquisition cost by region?"

You can't answer that until you convert this nested JSON mess into a proper Excel table.

## Why Data Analysts Struggle with JSON

JSON was designed for programmers, not analysts. Compare these two formats:

### CSV (What You're Used To)
```
Region,Customers,Revenue
North,150,45000
South,200,62000
```

Clean rows and columns. Open in Excel. Start analyzing.

### JSON (What You Get)
```json
{
  "regions": [
    {
      "name": "North",
      "metrics": {"customers": 150, "revenue": 45000}
    },
    {
      "name": "South", 
      "metrics": {"customers": 200, "revenue": 62000}
    }
  ]
}
```

Data is **nested** inside objects. Excel shows `[object Object]` instead of actual numbers.

## Common JSON Sources for Data Analysts

### 1. CRM Systems (Salesforce, HubSpot)

**Use case:** Export all deals closed this quarter for pipeline analysis.

**Problem:** Deals have nested contact info, company info, and custom fields.

**Typical structure:**
```json
{
  "id": "deal_123",
  "amount": 50000,
  "company": {
    "name": "Acme Corp",
    "industry": "Software"
  },
  "contacts": [
    {"name": "John", "role": "Decision Maker"},
    {"name": "Sarah", "role": "Influencer"}
  ]
}
```

**What you need:** Flat table with columns like `deal_id`, `amount`, `company_name`, `company_industry`, `primary_contact`.

### 2. Web Analytics (Google Analytics 4)

**Use case:** Analyze traffic sources and conversion rates.

**Problem:** GA4 API returns deeply nested event data.

**Typical structure:**
```json
{
  "rows": [
    {
      "dimensionValues": [
        {"value": "google"},
        {"value": "organic"}
      ],
      "metricValues": [
        {"value": "1523"},
        {"value": "0.034"}
      ]
    }
  ]
}
```

**What you need:** Table with columns `source`, `medium`, `sessions`, `conversion_rate`.

### 3. Survey Data (Typeform, SurveyMonkey)

**Use case:** Analyze customer satisfaction survey results.

**Problem:** Responses are nested inside answer arrays.

**Typical structure:**
```json
{
  "responses": [
    {
      "respondent_id": "R1",
      "answers": [
        {"question_id": "Q1", "answer": "Very Satisfied"},
        {"question_id": "Q2", "answer": "5"}
      ]
    }
  ]
}
```

**What you need:** Wide table with one column per question.

## The Data Analyst's JSON-to-Excel Workflow

### Step 1: Get Your JSON Data

**From Salesforce:**
1. Reports → Export → JSON format
2. Or use Data Loader (exports SOQL queries as JSON)

**From Google Analytics:**
1. Use GA4 API Explorer
2. Or export from BigQuery as JSON

**From HubSpot:**
1. Settings → Integrations → API Key
2. Use HubSpot API to export deals/contacts
3. Or ask your dev team for a JSON export

### Step 2: Convert to Excel

This is where most analysts get stuck. Standard Excel import fails because it can't handle nested JSON.

**Don't use:**
- ❌ Excel's "Get Data from JSON" (only works for simple flat JSON)
- ❌ Power Query (requires M language knowledge)
- ❌ Python/R scripts (you're not a programmer)

**Use JsonExport instead:**
1. Visit [jsonexport.com](https://jsonexport.com)
2. Upload your JSON file (or paste the text)
3. Switch to **"Table View"** to see nested data properly
4. Download as Excel

### Step 3: Data Cleaning in Excel

Now that you have a proper table, standard Excel skills apply:

**Remove duplicates:**
```
Data → Remove Duplicates
```

**Fill blank cells:**
```
Select column → Ctrl+G → Special → Blanks → Type = ↑ → Ctrl+Enter
```

**Split combined fields:**
```
Data → Text to Columns
```

**Create calculated columns:**
```
=[@Revenue]/[@Customers]  (for CAC)
```

### Step 4: Analysis \u0026 Visualization

Create your deliverables:
- **PivotTables** for summary statistics
- **Charts** for trends
- **Conditional formatting** for highlighting outliers
- **Slicers** for interactive dashboards

## Real-World Use Case: Marketing ROI Analysis

### The Ask
CMO wants to know: Which marketing channels have the best ROI?

### The Data
HubSpot API gives you JSON with:
- Deals (amount, close date, source)
- Ad spend per channel (from Google Ads API, also JSON)

### The Problem
100 deals × 5 properties each = 500 data points to manually extract.

### The Solution

**1. Export deals from HubSpot:**
```json
{
  "deals": [
    {
      "id": "D1",
      "amount": 25000,
      "source": "Google Ads",
      "campaign": "Q4 Promo"
    }
  ]
}
```

**2. Export ad spend from Google Ads:**
```json
{
  "campaigns": [
    {
      "name": "Q4 Promo",
      "spend": 5000,
      "clicks": 1200
    }
  ]
}
```

**3. Convert both to Excel**

**4. Join in Excel using VLOOKUP:**
```
=VLOOKUP([@Campaign], AdSpend!A:C, 2, FALSE)
```

**5. Calculate ROI:**
```
=[@Revenue]/[@AdSpend]
```

**6. Create PivotTable:**
- Rows: Source
- Values: Sum of Revenue, Sum of Spend, Average of ROI

**Result:** Clear table showing Google Ads ROI = 5x vs Facebook Ads ROI = 3x.

**Time saved:** 4 hours of manual data wrangling.

## Handling Complex JSON Structures

### Parent-Child Relationships

**Scenario:** One customer has multiple orders.

**JSON:**
```json
{
  "customer_id": "C1",
  "name": "Alice",
  "orders": [
    {"order_id": "O1", "total": 100},
    {"order_id": "O2", "total": 200}
  ]
}
```

**Excel needs two tables:**

**Customers table:**
| customer_id | name  |
|-------------|-------|
| C1          | Alice |

**Orders table:**
| customer_id | order_id | total |
|-------------|----------|-------|
| C1          | O1       | 100   |
| C1          | O2       | 200   |

JsonExport's "Nested View" creates both sheets automatically. You can then:
- Use Power Query to join them
- Or use SUMIF to calculate total per customer:
```
=SUMIF(Orders!A:A, [@customer_id], Orders!C:C)
```

### Time Series Data

**Scenario:** Daily metrics from Google Analytics.

**JSON:**
```json
{
  "data": [
    {
      "date": "2024-01-15",
      "metrics": {
        "sessions": 1500,
        "bounceRate": 0.45,
        "conversionRate": 0.023
      }
    }
  ]
}
```

**After conversion to Excel:**

| date       | sessions | bounceRate | conversionRate |
|------------|----------|------------|----------------|
| 2024-01-15 | 1500     | 0.45       | 0.023          |

Now you can:
- Create a line chart showing sessions over time
- Calculate week-over-week growth:
```
=([@sessions]-OFFSET([@sessions],-7,0))/OFFSET([@sessions],-7,0)
```
- Apply moving averages for trend analysis

## Data Quality Checks

### 1. Null/Missing Value Detection

After converting JSON to Excel, check for:

**Empty cells:**
```
=COUNTBLANK(A:A)
```

**Null strings:**
```
=COUNTIF(A:A, "null")
```

**Zero values where they shouldn't be:**
```
=COUNTIFS(Revenue, 0, Status, "Closed Won")
```

### 2. Duplicate Detection

**Find duplicate customer IDs:**
```
=COUNTIF($A$2:$A$1000, A2) > 1
```

Apply conditional formatting to highlight duplicates.

### 3. Data Type Validation

**Check if dates are valid:**
```
=ISNUMBER(DATEVALUE(A2))
```

**Check if numbers are numeric:**
```
=ISNUMBER(A2)
```

## Advanced Excel Techniques After Conversion

### 1. Dynamic PivotTables

Instead of hardcoded ranges:
```
=OFFSET(Sheet1!$A$1, 0, 0, COUNTA(Sheet1!$A:$A), COUNTA(Sheet1!$1:$1))
```

This auto-expands as you add data.

### 2. Power Query for Repeated Updates

If you get weekly JSON exports:

1. Set up initial transformation in Power Query
2. Save the query
3. Next week: Just replace the source file, click "Refresh"
4. All transformations reapply automatically

### 3. Dashboard with Slicers

Create an exec-ready dashboard:
- PivotTable summarizing key metrics
- Slicers for Date Range, Region, Product
- Charts auto-update based on slicer selection

## Common Challenges \u0026 Solutions

### Challenge 1: "My JSON has 50 fields, but I only need 5"

**Solution:** After converting to Excel, just delete the columns you don't need. Or use Power Query to select specific columns before loading.

### Challenge 2: "Dates are showing as weird numbers"

**Example:** `1673798400` instead of `2024-01-15`

**This is a Unix timestamp.** Convert to Excel date:
```
=(A2/86400)+DATE(1970,1,1)
```

Or use JsonExport which auto-detects these and converts them.

### Challenge 3: "I have 10 JSON files to combine"

**Solution:** 
1. Combine JSON files into one array first:
```json
{ "data": [
  /* contents of file1.json */,
  /* contents of file2.json */,
  /* etc */
]}
```

2. Convert the combined file to Excel

Or use Power Query's "Combine Files" feature.

### Challenge 4: "My manager wants this report weekly"

**Solution:** Document your process:
1. Export JSON from source (write step-by-step)
2. Convert using JsonExport
3. Run saved Excel formulas/PivotTables
4. Export as PDF

After 2-3 times, ask IT to automate the JSON export part.

## Alternatives (And Why They're Harder)

### Power Query (Excel Built-in)

**Pros:**
- Already in Excel
- Can automate refreshes

**Cons:**
- ❌ Requires learning M language for complex transformations
- ❌ Steep learning curve for nested JSON
- ❌ Error messages are cryptic

**Verdict:** Good for simple flat JSON, overkill for one-time analyses.

### Python with Pandas

**Pros:**
- Very powerful
- Can handle any JSON structure

**Cons:**
- ❌ You need to learn Python programming
- ❌ Setup required (install Python, libraries)
- ❌ Not shareable with non-technical colleagues

**Verdict:** Only if you're already a Python user.

### Tableau Prep

**Pros:**
- Visual data preparation
- Handles JSON

**Cons:**
- ❌ Costs $70/month per user
- ❌ Another tool to learn
- ❌ Overkill for simple conversions

**Verdict:** Only if your org already has licenses.

## Privacy \u0026 Compliance

As a data analyst, you handle sensitive information:
- Customer PII (names, emails, addresses)
- Financial data (revenue, costs)
- Health information (if you're in healthcare)

Many JSON converters require you to **upload your file to their server**. This is a compliance risk.

**JsonExport processes everything client-side:**
- ✅ Data never leaves your browser
- ✅ No server uploads
- ✅ Works offline
- ✅ GDPR/HIPAA compliant (no data transmission)

## Beginner-Friendly Walkthrough

**Scenario:** You have a JSON file with customer data. You need an Excel report.

**Step 1: Save JSON to your computer**
- Right-click the JSON file → "Save As" → `customers.json`

**Step 2: Open JsonExport**
- Go to [jsonexport.com](https://jsonexport.com)
- No signup required

**Step 3: Load your file**
- Click "Upload File" button
- Select `customers.json`
- Or paste JSON text directly

**Step 4: Preview the data**
- You'll see a table preview
- Check if columns look correct
- If data looks weird, switch to "Nested View" mode

**Step 5: Download Excel**
- Click "Download Excel" button
- Save as `customers.xlsx`

**Step 6: Analyze in Excel**
- Open `customers.xlsx`
- Create PivotTables, charts, formulas as needed

**Total time:** 2 minutes.

## Conclusion

Data analysis shouldn't start with a 2-hour battle against JSON formatting.

Your skills are:
- **Statistics** (calculating averages, percentiles, correlations)
- **Visualization** (creating compelling charts)
- **Business context** (knowing which metrics matter)

Not **programming** or **file format wrangling**.

Use the right tool to get JSON into Excel quickly, then focus on actual analysis.

[Convert Your JSON Data Now](https://jsonexport.com) - No coding required.

---

**Related Resources:**
- [Convert Salesforce/HubSpot JSON to CSV](/blog/convert-stripe-shopify-json-to-csv)
- [Google Analytics JSON to Excel Guide](/blog/how-to-flatten-nested-json-without-python)
- [Data Privacy Best Practices](/blog/why-you-should-not-upload-json-online)
