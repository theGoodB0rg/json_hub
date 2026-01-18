---
title: "Airtable Export to Excel: Keep Your Linked Records Intact"
date: "2026-01-18"
description: "Export Airtable bases to Excel without losing linked records, attachments, or formula results. Every method compared."
keywords: ["airtable export to excel", "airtable to spreadsheet", "export airtable data", "airtable csv export", "airtable linked records excel"]
---

Airtable markets itself as "spreadsheet meets database." But when you actually try to get your data INTO a spreadsheet, you hit walls.

Their CSV export breaks linked records. Their API is well-documented but returns deeply nested JSON. And the Excel-formatted export they added last year? Still strips out crucial data.

Here's how to get everything out—including the stuff Airtable doesn't want you to export easily.

## The Export Options (Compared)

Airtable gives you three ways out:

| Method | Linked Records | Attachments | Formulas | Lookups |
|--------|---------------|-------------|----------|---------|
| CSV Download | ❌ IDs only | ❌ URLs in text | ❌ Formula text | ❌ Formula text |
| Grid View Copy | ✅ Text values | ❌ Just names | ✅ Results | ✅ Results |
| API Export | ✅ Full data | ✅ Full URLs | ✅ Results | ✅ Results |

**Bottom line:** If you have linked records or lookups, the API is your only real option.

## Method 1: CSV Export (Fast but Limited)

In Airtable:

1. Open your base
2. Click the table name dropdown → Download CSV
3. Open in Excel

**What works:**
- Text, numbers, dates
- Single select fields
- Long text (preserves line breaks)
- Checkboxes (TRUE/FALSE)

**What breaks:**
- **Linked records:** Show as internal IDs like `recXYZ123abc`
- **Lookups:** Show the formula, not the value
- **Formulas:** Same—formula text instead of result
- **Attachments:** Raw URLs, one per line in the same cell
- **Multi-select:** Comma-separated in one cell

For a quick dump of simple data, this works. For relational data, useless.

## Method 2: Copy-Paste from Grid View

This trick works better than CSV for small datasets:

1. Open your table in Grid view
2. Click the first row number to select row
3. Shift+Click the last row
4. Ctrl+C (or Cmd+C)
5. Paste into Excel

**Why this is better:**
- Linked records paste as their **primary field value** (not IDs)
- Formulas paste as the **result** (not the formula)
- Lookups paste as the **looked-up value**

**Why this sucks:**
- Maximum ~10,000 rows before browser chokes
- Attachments paste as filenames only
- Long text might get truncated
- No automation—manual every time

Good for one-time exports under 1,000 rows.

## Method 3: API Export (The Real Solution)

Airtable's API returns complete data including linked record details.

**Step 1: Get your API key**

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Create a personal access token
3. Scope it to your base
4. Copy the token

**Step 2: Find your base and table IDs**

Open your base. The URL looks like:
```
https://airtable.com/appXXXXXX/tblYYYYYY/...
```

- `appXXXXXX` = Base ID
- `tblYYYYYY` = Table ID

**Step 3: Make the API call**

Using curl:
```bash
curl "https://api.airtable.com/v0/appXXXXXX/tblYYYYYY" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Or in Postman:
- GET `https://api.airtable.com/v0/{baseId}/{tableId}`
- Header: `Authorization: Bearer YOUR_TOKEN`

**Step 4: Handle pagination**

Airtable returns max 100 records per request. If you have more:

```json
{
  "records": [...],
  "offset": "rec123abc..."
}
```

Use the offset in your next request:
```
?offset=rec123abc...
```

Repeat until no offset is returned.

**Step 5: Convert JSON to Excel**

The API returns nested JSON:

```json
{
  "records": [{
    "id": "rec123",
    "fields": {
      "Name": "Project Alpha",
      "Client": ["rec456"],
      "Status": "Active",
      "Budget": 50000,
      "Team": ["recABC", "recDEF"],
      "Due Date": "2026-03-15"
    }
  }]
}
```

Notice: `Client` and `Team` are still record IDs, not names.

**To get names, you need to:**
1. Fetch the linked table (Clients)
2. Build a lookup: `rec456` → "Acme Corp"
3. Replace IDs with names

Or paste the JSON into [JsonExport](https://jsonexport.com), which:
1. Flattens the nested structure
2. Creates separate columns for array items (`Team[0]`, `Team[1]`)
3. Exports clean Excel

You'll still have IDs for linked records, but the structure is usable.

## Expanding Linked Records

To get linked record names directly from the API, use the `returnFieldsByFieldId` parameter... just kidding, Airtable doesn't have a native "expand" parameter.

**Workaround: Multiple API calls**

1. Fetch main table
2. Collect all linked record IDs
3. Fetch linked table with those IDs
4. Join in your script/Excel

**Python example:**
```python
import requests

headers = {"Authorization": "Bearer YOUR_TOKEN"}

# Fetch projects
projects = requests.get(
    "https://api.airtable.com/v0/appXXX/Projects",
    headers=headers
).json()

# Collect client IDs
client_ids = set()
for record in projects["records"]:
    client_ids.update(record["fields"].get("Client", []))

# Fetch clients by ID
clients = {}
for cid in client_ids:
    resp = requests.get(
        f"https://api.airtable.com/v0/appXXX/Clients/{cid}",
        headers=headers
    ).json()
    clients[cid] = resp["fields"]["Name"]

# Replace IDs with names
for record in projects["records"]:
    client_ids = record["fields"].get("Client", [])
    record["fields"]["Client_Names"] = [clients[cid] for cid in client_ids]
```

Then export to JSON and convert to Excel.

## Attachments

Airtable attachments are complex objects:

```json
"Attachments": [
  {
    "id": "attXXX",
    "url": "https://dl.airtable.com/.attachments/...",
    "filename": "contract.pdf",
    "type": "application/pdf",
    "size": 245123
  }
]
```

**In CSV export:** You get just the URLs, mashed into one cell.

**In API export:** You get structured data. Choose what you need:
- `filename` for a clean list
- `url` for download links
- Both, in separate columns

When converting JSON to Excel, JsonExport creates:
- `Attachments[0].filename`
- `Attachments[0].url`
- `Attachments[1].filename`
- etc.

## Formulas and Rollups

Unlike linked records, formulas and rollups export correctly via API:

```json
{
  "fields": {
    "Name": "Q1 2026",
    "Total Revenue": 150000,     // Rollup: SUM(Deals.Amount)
    "Deal Count": 23,            // Rollup: COUNT(Deals)
    "Win Rate": 0.67            // Formula: Won/Total
  }
}
```

These are the computed values, ready to use.

## Synced Tables

If you're using Airtable's synced tables (data from another base), you can export them just like regular tables. The sync happens on Airtable's side—your export includes current values.

**Gotcha:** Synced fields are read-only. If you re-import modified data, you can't update synced fields.

## Views vs Tables

Exporting a **view** (filtered/sorted) vs the full **table**:

**CSV export:** Exports only visible rows in current view. Respects your filters.

**API export:** By default, returns ALL records. To filter:

```
?filterByFormula=AND({Status}="Active", {Budget}>10000)
```

Or use view parameter:
```
?view=Active%20Projects
```

## Automation Ideas

If you export weekly:

**Option 1: Airtable Automations → Webhooks**

1. Create an automation: Run weekly
2. Action: Find records (with filter)
3. Action: Run script (format as JSON)
4. Action: Send webhook to your server

**Option 2: Third-party tools**

- **Make (Integromat):** Airtable module → Google Sheets → download as XLSX
- **Zapier:** Similar, but more limited on data volume
- **n8n (self-hosted):** Full control, free

**Option 3: Scheduled script**

Run a Python/Node script on cron that:
1. Calls Airtable API
2. Converts to Excel using a library
3. Emails you the file or saves to Dropbox

## Common Export Problems

### "Some records missing"

You have over 100 records but only got 100.

**Cause:** Airtable paginates. You need to follow the `offset` until there's none.

### "Linked records show as IDs"

Expected behavior for CSV and basic API exports.

**Fix:** Use the multi-table join approach described above.

### "Formula columns are blank"

Formula might reference an error or return empty for some rows.

**Check:** Open Airtable, look for `ERROR` or empty formula results.

### "Attachments won't open"

Airtable attachment URLs expire after a few hours.

**If you need permanent links:**
1. Download attachments via URL
2. Re-host them (S3, Drive, etc.)
3. Replace URLs in your export

Or just use the URLs for immediate download, not long-term storage.

## Excel Import Back to Airtable

Exporting is one thing. Getting data back in:

**CSV import:**
1. Table → Import CSV
2. Map columns to fields
3. Choose: append or replace

**API import:**
```json
POST /v0/{base}/{table}
{
  "records": [
    {"fields": {"Name": "New Project", "Budget": 25000}}
  ]
}
```

**Gotcha:** You can't import back into lookup/formula fields—they're computed.

## The Airtable → Excel Template Workflow

For recurring reports:

**First time:**
1. Export via API (all records)
2. Convert JSON to Excel via JsonExport
3. Build your analysis (pivot tables, charts, formulas)
4. Save as template

**Each export after:**
1. Re-run API export
2. Convert to Excel
3. Paste into template's "Data" sheet
4. Everything auto-updates

Takes 5 minutes once set up.

## Privacy

Airtable bases often contain customer data, PII, or business-sensitive info.

**When using API exports:**
- Token is between you and Airtable (encrypted)
- JSON conversion in JsonExport happens in your browser
- No data uploaded to any server

**When using third-party automation tools:**
- Read their privacy policy
- Data passes through their servers
- May not be GDPR-compliant

For sensitive data, stick to local solutions: API → your machine → JsonExport (browser) → Excel.

## Summary

**Simple tables:** CSV export works fine.

**Relational data:** API + JSON conversion required.

**Recurring exports:** Build a template, refresh data weekly.

Airtable is powerful for organising work. Just expect some friction when it's time to get data out.

[Convert Your Airtable JSON Export](https://jsonexport.com) - Flatten nested records and attachments automatically.

---

**Related Guides:**
- [Notion Export to Excel Complete Guide](/blog/notion-export-excel-complete-guide)
- [Firebase JSON Export to Excel](/blog/firebase-json-export-to-excel)
