---
title: "How to Export Supabase JSON to Excel (2026 Guide)"
date: "2026-01-23"
description: "Learn how to export data from Supabase to Excel. Compare using the Supabase Dashboard, SQL Editor, and client-side tools like JsonExport."
keywords: ["supabase to excel", "supabase export json", "supabase csv export", "export supabase data", "supabase dashboard export"]
---

Supabase is an incredible open-source Firebase alternative, giving you the power of PostgreSQL with a slick UI. But when your product manager asks for a "weekly report in Excel," the slick UI hits a wall.

Exporting nested JSON data from Supabase to a clean Excel spreadsheet isn't as one-click as it should be.

In this guide, I'll show you **3 authoritative ways** to get your data out of Supabase and into Excel—whether you're a developer comfortable with SQL or a founder who just needs the file.

---

## Method 1: The "No-Code" Way (Supabase Dashboard + JsonExport)

**Best For:** Ad-hoc reports, non-technical team members, and handling **nested JSON**.

Supabase's built-in CSV export is... basic. It often duplicates rows when handling joined tables or JSONB columns. The better approach is to grab the raw JSON and let a specialized tool flatten it.

### Step 1: Export JSON from Dashboard
1.  Log in to your **Supabase Dashboard**.
2.  Go to the **Table Editor** (the spreadsheet icon).
3.  Select your table (e.g., `users` or `orders`).
4.  *Crucial Step:* If you have JSONB columns, they will look like `{...}` in the grid.
5.  Click **Export** (top right) and choose **Download as JSON**. 
    *   *Why JSON?* CSV exports often break nested JSON objects into unreadable strings.

### Step 2: Convert to Excel
Now you have a `rows.json` file. Don't try to open this manually.
1.  Go to [JsonExport.com](https://jsonexport.com).
2.  Drag and drop your `rows.json`.
3.  **JsonExport** will automatically detect the JSONB columns and "flatten" them into clean Excel columns (e.g., `metadata.plan_type`, `metadata.last_login`).
4.  Click **Download Excel**.

**Verdict:** The cleanest way to handle complex Supabase data without writing code.

---

## Method 2: The "SQL Power" Way (pgAdmin / SQL Editor)

**Best For:** specific data subsets or complex joins.

If you only need *some* users (e.g., "active users signed up last week"), don't export the whole table. Use SQL.

### Step 1: Run the Query
In the Supabase **SQL Editor**:

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as name,
  created_at
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Step 2: Export Results
1.  Run the query.
2.  In the **Results** pane, click **CSV** (bottom right of the results).
3.  Open that CSV in Excel.

**Verdict:** Great for simple text data. **Fails hard** if you try to export arrays or complex JSON objects directly, as Supabase will export them as stringified JSON `"{...}"` inside the CSV cell.

---

## Method 3: The "Automated" Way (Python Scripts)

**Best For:** Recurring daily/weekly reports sent via email.

If you need this report every Monday at 9 AM, use the `supabase-py` client.

```python
from supabase import create_client
import pandas as pd

url = "YOUR_SUPABASE_URL"
key = "YOUR_SUPABASE_KEY"
supabase = create_client(url, key)

# 1. Fetch data
response = supabase.table('orders').select('*, items(*)').execute()

# 2. Flatten and Convert
# The response.data is a list of dictionaries (JSON)
df = pd.json_normalize(response.data)

# 3. Save
df.to_excel("weekly_orders.xlsx", index=False)
```

**Verdict:** Requires maintenance, but saves time in the long run.

---

## Common Issues & Troubleshooting

### Problem: "My JSONB column is just a string in Excel"
If you use the default CSV export, Excel thinks your JSON object `{"id": 1, "name": "foo"}` is just text. You can't filter by ID.
*   **Fix:** Use **Method 1**. JsonExport parses those strings back into objects and splits them into distinct columns.

### Problem: "I have too many rows for the Dashboard"
Supabase dashboard export limits row counts (often 100 or 1000 depending on pagination).
*   **Fix:** Use **Method 2** (SQL) or **Method 3** (API) to fetch larger datasets.

---

## Conclusion

-   For **quick, accurate exports** (especially with JSONB): Download JSON and use [JsonExport](https://jsonexport.com).
-   For **filtered data**: Use SQL.
-   For **automation**: Use Python.

Don't let your data get stuck in the database. Use the right tool for the job.
