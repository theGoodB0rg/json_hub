---
title: "Notion Export to Excel: Get All Your Database Data Out"
date: "2026-01-18"
description: "Export Notion databases to Excel with all properties, relations, and rollups intact. No more copy-pasting or losing your linked data."
keywords: ["notion export to excel", "notion database export", "notion to spreadsheet", "export notion data", "notion csv export"]
---

Notion is fantastic for organizing work. But when you need to share data with someone who doesn't use Notion—or run analysis that Notion's views can't handle—you need Excel.

The problem: Notion's built-in export is half-baked. CSV exports lose relations. Markdown exports are useless for data. And copying rows by hand gets old fast when you have 500+ records.

Here's how to actually get your Notion data into Excel properly.

## The Built-In Export (And Why It Fails)

In Notion:

1. Open your database
2. Click ••• → Export
3. Choose "CSV" or "Markdown & CSV"
4. Download

**What you get:**
- Text fields work fine
- Dates export correctly
- Numbers come through

**What breaks:**
- **Relations:** Become cryptic IDs like `a7b3c9d2-1e4f-...`
- **Rollups:** Show the formula, not the result
- **Linked databases:** Missing entirely
- **Files/images:** Just the URLs
- **Multi-select:** Comma-separated in one cell (breaks filtering)

For a simple table with text and dates? The CSV export works. For anything relational? Useless.

## Method 1: Export → Fix in Excel (Manual)

If you only need this once:

**Step 1: Export the main database**

Database → ••• → Export → CSV

**Step 2: Export related databases separately**

If your "Projects" database has a relation to "Clients", export Clients too.

**Step 3: Fix relations with VLOOKUP**

Notion exports relation IDs like:
```
Client: a7b3c9d2-1e4f-4a5b-8c6d-9e0f1a2b3c4d
```

In your Clients export, the first column is usually the page ID. Match them:

```excel
=VLOOKUP([@ClientID], Clients!A:B, 2, FALSE)
```

Now you have client names instead of IDs.

**Step 3: Split multi-selects**

Tags column shows: `Design,Development,Urgent`

Use Text to Columns:
1. Select the column
2. Data → Text to Columns
3. Delimiter: comma
4. Creates: `Tag_1`, `Tag_2`, `Tag_3` columns

**Time required:** 20-30 minutes for a moderately complex database.

## Method 2: Notion API → JSON → Excel

For ongoing exports or complex databases:

**Step 1: Get your Notion API key**

1. Go to [notion.so/my-integrations](https://notion.so/my-integrations)
2. Click "New integration"
3. Name it "Excel Export" 
4. Copy the secret key

**Step 2: Share database with your integration**

1. Open your database in Notion
2. Click ••• → Connections → Add connection
3. Select your integration

**Step 3: Query the API**

Using Postman or curl:

```bash
curl -X POST 'https://api.notion.com/v1/databases/DATABASE_ID/query' \
  -H 'Authorization: Bearer YOUR_SECRET' \
  -H 'Notion-Version: 2022-06-28' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Replace `DATABASE_ID` with your database ID (the long string in the URL).

**Step 4: Convert JSON to Excel**

The API returns deeply nested JSON:

```json
{
  "results": [{
    "properties": {
      "Name": {"title": [{"plain_text": "Project Alpha"}]},
      "Status": {"select": {"name": "In Progress"}},
      "Client": {"relation": [{"id": "abc123"}]},
      "Due Date": {"date": {"start": "2026-02-15"}}
    }
  }]
}
```

Paste this into [JsonExport](https://jsonexport.com). The tool:

1. Flattens nested properties into columns
2. Extracts `Status.select.name` → "In Progress"
3. Pulls `Due Date.date.start` → "2026-02-15"
4. Lists all relations (even multiple)

Download as Excel. Done.

## Handling Notion's Weird Property Types

Notion has 20+ property types. Here's how each exports:

| Property Type | CSV Export | API Export |
|--------------|------------|------------|
| Title | Works | Works |
| Text | Works | Works |
| Number | Works | Works |
| Select | Works | Works |
| Multi-select | Comma-separated | Array of objects |
| Date | Works | Nested object |
| Checkbox | TRUE/FALSE | Boolean |
| URL | Works | String |
| Email | Works | String |
| Phone | Works | String |
| **Relation** | ❌ IDs only | Full page data available |
| **Rollup** | ❌ Formula text | Computed value |
| **Formula** | ❌ Formula text | Computed value |
| Person | ❌ User IDs | User object |
| Files | URLs only | URLs + metadata |
| Created time | Works | ISO timestamp |
| Last edited | Works | ISO timestamp |

The API gives you usable data for relations, rollups, and formulas. CSV doesn't.

## Real Example: Project Tracker Export

**Notion database structure:**
- Project Name (title)
- Client (relation → Clients database)
- Status (select: Not Started, In Progress, Complete)
- Budget (number, currency)
- Team Members (multi-select)
- Due Date (date)
- Hours Logged (rollup: sum from Tasks)

**CSV export result:**
```
Project Name,Client,Status,Budget,Team Members,Due Date,Hours Logged
"Website Redesign","a7b3...","In Progress",15000,"Alice,Bob,Carol","2026-03-01","rollup:sum(Tasks.Hours)"
```

Client is an ID. Hours Logged is the formula, not the sum.

**API + JsonExport result:**
```
Project Name,Client.Name,Status.name,Budget,Team Members[0],Team Members[1],Due Date.start,Hours Logged.number
"Website Redesign","Acme Corp","In Progress",15000,"Alice","Bob","2026-03-01",47.5
```

Now you can actually analyze which client has the most projects, total hours by team member, etc.

## Linked Databases

Notion lets you create filtered views of the same database. These are "linked databases."

**Export behavior:**
- Only the source database exports
- Linked views don't have separate exports
- Filters from your linked view aren't applied

**Workaround:**

If you need a filtered export:

1. Create a filter in the source database view
2. Export from that filtered view
3. Notion exports only visible rows

Or use the API with filter parameters:

```json
{
  "filter": {
    "property": "Status",
    "select": {"equals": "In Progress"}
  }
}
```

## Recurring Exports

If you export weekly for reports:

**Option 1: Scheduled Notion automations (workaround)**

Notion doesn't have scheduled exports. But you can:

1. Create a Zapier/Make automation
2. Trigger: Schedule (every Monday)
3. Action: Query Notion API
4. Action: Format as CSV
5. Action: Email or save to Google Drive

**Option 2: Manual with template**

Export once. Build your Excel dashboard with formulas. Next week:

1. Export again
2. Paste data into "Data" sheet
3. Formulas auto-update

Takes 5 minutes once the template exists.

## Common Issues

### "Export is empty"

You exported a view with filters that excluded everything.

**Fix:** Switch to "All" view before exporting.

### "Dates are in wrong format"

Notion exports dates as `YYYY-MM-DD`. Excel might show them as text.

**Fix:** Select column → Format Cells → Date → Choose your format.

### "Relations show as IDs"

This is Notion's limitation. Use the API method or VLOOKUP from a separate relation database export.

### "Numbers have commas as decimals"

Locale issue. Notion uses US format (period for decimals).

**Fix:** Find/Replace: replace `,` with `.` in number columns.

## Formulas and Rollups

Notion's calculated fields don't export the result—they export the formula definition.

Example rollup in Notion shows: `$12,500`
CSV export shows: `rollup(Tasks, Budget, sum)`

**Solutions:**

1. **API method:** Returns computed values
2. **Duplicate as text:** Create a formula that converts to plain text: `format(prop("Budget Rollup"))`. Export that column.
3. **Manual:** Just type the numbers in a regular column (if data doesn't change often)

## Privacy Note

Notion databases often contain client names, project details, and internal data.

When using any export method:
- Review what's included before sharing
- Remove sensitive columns from Excel before distribution
- Use client-side tools (like JsonExport) that don't upload your data

Notion's API requests stay between you and Notion. The JSON conversion happens in your browser—no server sees your data.

## Summary

**For simple databases:** Notion's CSV export works.

**For relational data:** Use the API + JSON conversion.

**For recurring exports:** Build an Excel template and paste fresh data weekly.

The extra 10 minutes to set up proper exports saves hours of manual copy-paste and broken VLOOKUPs later.

[Convert Your Notion JSON Export](https://jsonexport.com) - Automatically flatten nested Notion properties.

---

**Related Guides:**
- [Airtable Export to Excel Complete Guide](/blog/airtable-export-excel-complete-guide)
- [Firebase JSON Export to Excel](/blog/firebase-json-export-to-excel)
