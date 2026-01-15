---
title: "HubSpot Export to Excel: Get All Contact and Deal Data"
date: "2026-01-16"
description: "Export HubSpot contacts, deals, and companies to Excel with all custom properties and relationships intact."
keywords: ["hubspot export to excel", "hubspot contacts export", "hubspot deals spreadsheet", "export hubspot data", "hubspot custom properties excel"]
---

HubSpot's interface is great for sales teams. For analysis? Less so. You need everything in Excel to build dashboards, forecast pipeline, or share with executives who don't have HubSpot access.

The built-in export button exists. But it only gives you the visible columns—usually about 10-15 fields. Your actual data has 50+ properties (custom fields, lifecycle stages, deal associations). Here's how to get all of it.

## The Basic Export (And Its Limits)

In HubSpot:

1. Contacts → Click "Export" in the top right
2. Select "Current view" or "All contacts"
3. Choose XLSX format
4. Download

**What you get:**
- Only columns visible in your current view
- Maximum ~20 properties (even if you have 100)
- Contact-level data only (no associated deals/companies)

**What's missing:**
- Custom properties you added
- Deal associations
- Activity history
- Company hierarchy

For a quick contact list export, this works. For real analysis? Useless.

## Method 1: Export with All Properties Selected

HubSpot's export dialog has a hidden trick:

**When exporting:**
1. Click "Export" → "Export contacts"
2. In the dialog, click **"All properties"** (don't use "current view")
3. Wait while it generates (can take 5+ minutes for 10K contacts)
4. Download from email link

**This gets you:**
- Every standard property (name, email, phone, source, etc.)
- Custom properties you've created
- System fields (created date, last modified, owner)

**Still missing:**
- Deal associations (which deals this contact is linked to)
-Company associations (which company they work for)
- Activity timeline (emails sent, meetings logged)

## Method 2: Separate Exports for Objects

HubSpot organizes data into objects:
- **Contacts:** People
- **Companies:** Organizations
- **Deals:** Sales opportunities
- **Tickets:** Support issues

Export each separately:

**Export contacts:**
- Contacts → Export → All properties

**Export companies:**
- Companies → Export → All properties

**Export deals:**
- Deals → Export board → All properties

**In Excel, join them:**

```
=VLOOKUP([@CompanyID], Companies!A:Z, 2, FALSE)
```

This matches contact → company name using the company ID.

**For deals associated with contacts:**

Deal exports include "Contact ID" column. Use:
```
=VLOOKUP([@ContactID], Contacts!A:Z, 3, FALSE)
```

To pull contact name into your deals spreadsheet.

## Method 3: Using HubSpot's Data Export Feature

For complete backups or massive exports:

1. Settings → Data Management → **Objects**
2. Select object (Contacts, Deals, etc.)
3. Click **"Export"**
4. Choose file format: XLSX
5. Select all properties or specific ones

This is HubSpot's "full dump" tool. You get:

- ALL records (no view filters applied)
- ALL properties (standard + custom)
- System timestamps
- Internal IDs you can use for joining

**Downside:** It's ALL-or-nothing. Can't filter to "only this month's deals."

## Handling Nested Properties

HubSpot stores related data as JSON in exports. For example:

**Deal owner field:**
```
hubspot_owner_id: {"id":"12345","email":"sarah@company.com","name":"Sarah Johnson"}
```

Excel shows this as text. You need to extract it.

**Option 1: Excel formulas (tedious)**
```
=MID(A2, FIND("name", A2)+7, FIND("}", A2, FIND("name", A2))-FIND("name", A2)-8)
```

That's hard to maintain.

**Option 2: JsonExport (automatic)**

1. Upload your HubSpot XLSX export
2. Tool detects JSON-encoded fields
3. Automatically creates columns:
   - `hubspot_owner_id.name` → "Sarah Johnson"
   - `hubspot_owner_id.email` → "sarah@company.com"
4. Download clean Excel file

Now you can pivot by owner name, not cryptic IDs.

## Custom Property Export Strategy

If you've customized HubSpot heavily (most companies have), plan your export:

**Before exporting:**
1. Settings → Properties
2. Note which properties matter for your analysis
3. Create a "master view" in HubSpot with those columns visible

**Why:** Even "All properties" export sometimes misses properties that aren't used actively. Having them in a view ensures they export.

## Real-World Use Case: Pipeline Forecasting

**Goal:** Show projected monthly revenue by deal stage.

**Data needed:**
- Deal amount
- Close date
- Deal stage
- Owner
- Company name
- Associated contacts

**HubSpot export:**
1. Deals → Export board → All properties
2. This gives deal-level data

**Missing piece:** Company names (deals export only has company IDs)

**Solution:**
1. Export companies separately
2. In Excel, use VLOOKUP:
   ```
   =VLOOKUP([@companyId], Companies!A:B, 2, FALSE)
   ```
3. Now you have company names in your deals sheet

**Dashboard:**
- Pivot table: Rows = Close Date (by month), Columns = Stage, Values = Sum of Amount
- Shows forecasted revenue by month and stage

## Exporting Historical Data

HubSpot's native export only gives you **current state**. If a contact's lifecycle stage changed from "Lead" to "Customer" last month, the export shows "Customer" (not the history).

**Workarounds:**

### 1. Use HubSpot Workflows (Proactive)
Create a workflow that logs changes:
- Trigger: "Lifecycle stage changes"
- Action: "Create task" with note of date + old value + new value

Export tasks later to see history.

### 2. Property History (Reactive)
HubSpot tracks who changed what and when. But this isn't exportable via normal exports.

**To see it:**
- Open individual record → click property → "View history"

For bulk analysis? You need to use the API or a paid tool.

### 3. Schedule Weekly Exports
Export to Excel every Monday. Save with date: `hubspot_contacts_2024-01-15.xlsx`

Track changes by comparing week-to-week files in Excel using formulas.

## Dealing with Line Items (Deal Products)

Deals can have multiple line items (products sold):

```
Deal: Acme Corp - Software License
Line Item 1: Basic Plan - $500/mo
Line Item 2: Add-on Feature - $100/mo
```

**Standard export problem:** Line items don't export.

**Workaround:**
1. Export deals
2. Separately export "Line Items" object (if you have Sales Hub Pro+)
3. Join in Excel using Deal ID

If you can't export line items (feature limited to higher plans), manually note product in deal name or custom property.

## Multi-Select Properties

HubSpot lets you pick multiple values for a property:

```
Industry: Healthcare;Technology;Finance
```

**Excel import issue:** This comes in as ONE cell.

**Fix in Excel:**
1. Select column
2. Data → Text to Columns
3. Delimiter: semicolon
4. Now each industry is in its own column: `Industry_1`, `Industry_2`, `Industry_3`

**For pivot tables:**
Use Power Query to "unpivot" these columns so each industry gets its own row.

## Activity Exports (Emails, Meetings)

Contact and deal exports don't include activities. To get those:

1. Reports → Create custom report
2. Add data: "Engagement" type
3. Pick "Emails sent", "Meetings completed", etc.
4. Add filters: date range, owner, contact properties
5. Export this report separately

Gives you activity-level detail you can summarize in Excel.

## Common Export Errors

### "Export taking too long"

HubSpot generates exports in background. For 50K+ records, wait 10-15 minutes.

**Fix:** Be patient. You'll get an email when ready.

### "Some properties missing"

You selected "All properties" but don't see custom fields you created.

**Reason:** Property might be set to "hidden" or only visible to admins.

**Fix:** Settings → Properties → find property → ensure "Show in forms/exports" is enabled

### "Can't open XLSX file"

Downloaded file says it's corrupted.

**Fix:** 
- Download again (sometimes browser interrupts)
- Try CSV format instead
- Check file size (0 bytes = failed export)

## Automation Options

If you export monthly for reports:

### Option 1: HubSpot Operations Hub
Paid add-on ($720/year) that can auto-export to SFTP, Google Sheets, or Dropbox.

### Option 2: Third-Party Tools
- **Coupler.io:** $29/month, auto-export Hub​Spot → Google Sheets → Excel
- **Skyvia:** Free tier, scheduled exports to CSV

### Option 3: Manual but Consistent
Create a checklist:
- [ ] Export contacts (all properties)
- [ ] Export companies (all properties)
- [ ] Export deals (all properties)
- [ ] Combine in Excel template with pre-built formulas
- [ ] Refresh pivot tables

Repeat first Monday of each month. Takes 15 minutes once you have the template.

## Combining HubSpot with Other Tools

Once you have clean Excel exports:

**Sales + Marketing alignment:**
- HubSpot: Lead source, campaign
- Salesforce: Closed deals, revenue
- **Join:** See which HubSpot campaigns drive revenue

**Customer success analysis:**
- HubSpot: Contact company
- Zendesk: Support ticket volume
- **Join:** Identify accounts with high ticket count (churn risk)

## Privacy Considerations

HubSpot contains PII (names, emails, phone numbers).

**When exporting:**
- Only include contacts you're legally allowed to analyze
- Remove unnecessary PII columns before sharing
- GDPR: Contacts can request deletion—reflected in your export

**JsonExport processes client-side:**
- Your HubSpot export never uploads to a server
- Conversion happens in your browser
- No third-party access

## Advanced: Deal-Contact Many-to-Many

Some deals have multiple contacts (decision maker, influencer, end user). HubSpot exports don't handle this well.

**What happens:**
Deal export includes "Primary contact" only.

**To get all contacts:**
1. Use HubSpot's association export (via API or Operations Hub)
2. Or manually note secondary contacts in a multi-select property

Then in Excel:
- One row per deal-contact pair
- Use pivot table to analyze (e.g., "Deals where legal counsel was involved")

## Template for Monthly Pipeline Report

**Exports needed:**
1. Deals (all properties, filter: Close date = This month + next 2 months)
2. Companies (just name, industry, owner)

**Excel setup:**
1. Import deals
2. VLOOKUP company name from companies sheet
3. Create pivot: Rows = Deal Stage, Columns = Month, Values = Sum Amount
4. Chart: Stacked bar showing pipeline by stage

**Save as template:** Next month, just refresh the data.

## Conclusion

HubSpot's native export gives you the basics. For real analysis, you need to:

1. Export each object separately (contacts, companies, deals)
2. Join them in Excel using IDs
3. Convert nested properties to usable columns
4. Build your dashboards

It's a few extra steps, but you get complete data without paying for BI tools or learning SQL.

[Clean Up Your HubSpot Export](https://jsonexport.com) - Automatically flatten nested properties.

---

**Related Guides:**
- [Salesforce to Excel Complete Guide](/blog/salesforce-to-excel-complete-guide)
- [CRM Data Analysis Best Practices](/blog/json-data-analysis-excel-guide)
