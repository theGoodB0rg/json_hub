---
title: "JSON to Excel for Weekly Reports: Complete Automation Guide (2026)"
date: "2026-01-18"
description: "Automate your weekly JSON to Excel workflow. Step-by-step guide for data analysts who need to convert JSON reports on a schedule. Save hours every week."
keywords: ["automate json to excel", "json weekly reports", "recurring json conversion", "json excel automation", "scheduled json export"]
---

It's Monday morning. Again.

You download the same JSON file from Salesforce. Again.  
You convert it to Excel. Again.  
You email it to your manager. Again.

**Every. Single. Week.**

Sound familiar?

You're spending **3-5 hours per week** on a task that should take 5 minutes. Let's fix that.

In this guide, I'll show you **3 ways to automate recurring JSON to Excel conversions**, ranked from simplest to most powerful.

---

## The Problem: Recurring JSON Hell

### The Weekly Grind

Here's what most data analysts do every Monday:

1. Log into Salesforce/HubSpot/Stripe
2. Export data as JSON
3. Open Excel, import JSON
4. Fight with Power Query for 20 minutes
5. Manually expand nested fields
6. Format columns
7. Save as Excel
8. Email to manager/team
9. Repeat next week

**Time wasted:** 30-60 minutes per week  
**Annual waste:** 26-52 hours  
**Your hourly rate:** Let's say $50/hour  
**Annual cost:** **$1,300 - $2,600** of your time

And that's assuming everything works perfectly. No errors, no schema changes, no nested objects breaking your Power Query.

---

## Real-World Scenarios

### Scenario 1: Marketing Analyst (Weekly Campaign Reports)

**Task:** Every Friday, download HubSpot campaign data (JSON) and create an Excel report for the CMO.

**Current Process:**
- Download JSON from HubSpot API
- Open Power Query
- Expand nested `campaign.metrics` object
- Export to Excel
- Apply formatting
- Email report

**Time:** 45 minutes/week

---

### Scenario 2: Sales Ops (Daily Lead Scoring)

**Task:** Every morning, export Salesforce leads (JSON) and score them in Excel for the sales team.

**Current Process:**
- Export leads as JSON
- Convert to Excel manually
- Run scoring formulas
- Upload back to Salesforce

**Time:** 30 minutes/day = **2.5 hours/week**

---

### Scenario 3: E-commerce Analyst (Monday Order Reports)

**Task:** Every Monday, pull Shopify orders from the weekend and create an inventory report.

**Current Process:**
- API call to Shopify (returns JSON)
- Convert JSON to Excel
- Pivot by product SKU
- Email to warehouse manager

**Time:** 1 hour/week

---

## Method 1: Bookmarked Workflow (Simple)

**Time to Set Up:** 5 minutes  
**Weekly Time Saved:** 20-30 minutes  
**Best For:** Non-technical analysts who want quick wins

### How It Works

Instead of starting from scratch every week, **bookmark your conversion workflow** so you can repeat it with one click.

### Step-by-Step Setup

#### Step 1: Create a Template Workflow

1. Go to [jsonexport.com](https://jsonexport.com)
2. Upload your **most recent JSON file** (e.g., last week's HubSpot export)
3. JsonExport will parse it and show the preview
4. Choose your preferred view (Flat, Table, or Nested)

#### Step 2: Bookmark the Page

**Chrome/Edge:**
- Press `Ctrl+D` (Windows) or `Cmd+D` (Mac)
- Name it: "Weekly HubSpot Report Conversion"
- Save to bookmarks bar

**Why this works:** JsonExport remembers your last settings. When you return, it's ready for the same conversion.

#### Step 3: Weekly Workflow (Now 2 Minutes)

Every Monday/Friday:
1. Download new JSON file from HubSpot
2. Click your bookmark
3. Drag new JSON file into JsonExport
4. Click "Download Excel"
5. Done

**Before:** 45 minutes  
**After:** 2 minutes  
**Time Saved:** 43 minutes/week = **37 hours/year**

### Pros ✅

- **Zero technical skills** required
- **5-minute setup**
- Works for any recurring JSON conversion
- No scripts to maintain

### Cons ❌

- Still requires manual download + upload
- Can't run automatically (you must trigger it)
- Doesn't handle emailing the report

---

## Method 2: Excel Power Query Refresh (Intermediate)

**Time to Set Up:** 30 minutes  
**Weekly Time Saved:** 40-50 minutes  
**Best For:** Excel power users with static JSON URLs

### How It Works

If your JSON file is accessible via a **static URL** (e.g., `https://api.example.com/reports/weekly.json`), you can set up Excel to **auto-refresh** the data.

### Step-by-Step Setup

#### Step 1: Import JSON via URL

1. Open Excel → Data tab
2. Get Data → From Web
3. Enter JSON URL: `https://api.salesforce.com/exports/leads.json`
4. Click OK
5. Power Query opens

#### Step 2: Configure Power Query

1. Expand nested objects (click expand icons)
2. Rename columns as needed
3. Apply filters
4. Click "Close & Load"

#### Step 3: Enable Auto-Refresh

1. Right-click the data table
2. Select "Refresh"
3. Go to Data → Queries & Connections
4. Right-click query → Properties
5. Check "Refresh data when opening the file"
6. Optionally: Set refresh interval (e.g., every 60 minutes)

#### Step 4: Weekly Workflow (Now 30 Seconds)

Every Monday:
1. Open Excel file
2. Data refreshes automatically
3. Save and send

**Before:** 45 minutes  
**After:** 30 seconds  
**Time Saved:** 44.5 minutes/week

### Pros ✅

- **One-click refresh** after setup
- Data updates automatically
- Built into Excel (no additional tools)

### Cons ❌

- **Requires static JSON URL** (not downloadable files)
- Learning curve for Power Query
- Breaks if JSON structure changes
- No error handling (query just fails silently)

### When to Use This Method

✅ Your JSON source has a **direct URL** (API endpoint)  
✅ You're comfortable with Power Query  
✅ JSON structure stays consistent week-to-week

❌ Skip if: JSON is downloaded manually, structure changes frequently

---

## Method 3: Python Script Automation (Advanced)

**Time to Set Up:** 2-3 hours  
**Weekly Time Saved:** 55-60 minutes (fully automated)  
**Best For:** Analysts who know Python or have developer support

### How It Works

Write a Python script that:
1. Fetches JSON from API
2. Converts to Excel
3. Saves to shared folder or emails report
4. Runs automatically on schedule (Windows Task Scheduler / cron)

### Step-by-Step Setup

#### Step 1: Install Dependencies

```bash
pip install requests pandas openpyxl schedule
```

#### Step 2: Write the Script

Save as `weekly_report.py`:

```python
import requests
import pandas as pd
from datetime import datetime
import smtplib
from email.message import EmailMessage

# Configuration
API_URL = "https://api.salesforce.com/leads/export"
API_KEY = "your_api_key_here"
OUTPUT_FILE = f"weekly_report_{datetime.now().strftime('%Y%m%d')}.xlsx"
EMAIL_TO = "manager@company.com"

def fetch_json_data():
    """Fetch JSON from API"""
    headers = {"Authorization": f"Bearer {API_KEY}"}
    response = requests.get(API_URL, headers=headers)
    return response.json()

def convert_to_excel(json_data):
    """Convert JSON to Excel"""
    # Flatten nested JSON
    df = pd.json_normalize(json_data['records'])
    
    # Write to Excel
    df.to_excel(OUTPUT_FILE, index=False, sheet_name='Leads')
    print(f"Excel file created: {OUTPUT_FILE}")

def send_email_report():
    """Email the Excel file"""
    msg = EmailMessage()
    msg['Subject'] = f'Weekly Sales Report - {datetime.now().strftime("%Y-%m-%d")}'
    msg['From'] = 'reports@company.com'
    msg['To'] = EMAIL_TO
    msg.set_content('Please find attached this week\'s sales report.')
    
    with open(OUTPUT_FILE, 'rb') as f:
        msg.add_attachment(f.read(), maintype='application', 
                          subtype='vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          filename=OUTPUT_FILE)
    
    # Send email (configure SMTP server)
    with smtplib.SMTP('smtp.company.com', 587) as smtp:
        smtp.starttls()
        smtp.login('reports@company.com', 'password')
        smtp.send_message(msg)
    
    print("Email sent!")

# Main execution
if __name__ == "__main__":
    print("Fetching data...")
    data = fetch_json_data()
    
    print("Converting to Excel...")
    convert_to_excel(data)
    
    print("Sending email...")
    send_email_report()
    
    print("Done!")
```

#### Step 3: Schedule the Script

**Windows (Task Scheduler):**

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Weekly JSON Report"
4. Trigger: Weekly, every Monday at 8:00 AM
5. Action: Start a program
6. Program: `C:\Python\python.exe`
7. Arguments: `C:\Scripts\weekly_report.py`
8. Finish

**macOS/Linux (cron):**

```bash
crontab -e
```

Add line:
```
0 8 * * 1 /usr/bin/python3 /path/to/weekly_report.py
```

(Runs every Monday at 8 AM)

#### Step 4: Weekly Workflow (Now Automatic)

Every Monday at 8 AM:
1. Script runs automatically
2. Fetches latest JSON
3. Converts to Excel
4. Emails to manager
5. **You do nothing**

**Before:** 45 minutes  
**After:** 0 minutes (fully automated)  
**Time Saved:** 45 minutes/week = **39 hours/year**

### Pros ✅

- **Fully automated** (zero manual work)
- Error handling + logging
- Can integrate with any API
- Easily customizable

### Cons ❌

- **Requires Python knowledge** (or developer help)
- 2-3 hours initial setup
- Must maintain script if API changes
- Debugging can be time-consuming

### When to Use This Method

✅ You know Python or have dev support  
✅ Task is highly repetitive (daily/weekly)  
✅ Worth the upfront investment  
✅ API access is available

❌ Skip if: You're not technical, one-time setup isn't worth it

---

## Comparison: Which Automation Method?

| Criteria | Bookmarked Workflow | Power Query Refresh | Python Script |
|----------|---------------------|---------------------|---------------|
| **Setup Time** | 5 minutes | 30 minutes | 2-3 hours |
| **Weekly Time Saved** | 43 minutes | 44.5 minutes | 45 minutes |
| **Automation Level** | Semi-automated | Auto-refresh | Fully automated |
| **Technical Skill** | None | Medium | High |
| **Maintenance** | None | Low | Medium |
| **Best For** | Quick wins | Excel users | Developers |

---

## Time Savings Calculator

**Your Current Weekly Time:** _____ minutes

**Choose Your Method:**
- Bookmarked Workflow: Save 20-30 min/week
- Power Query Refresh: Save 40-50 min/week
- Python Script: Save 50-60 min/week

**Annual Time Saved:**  
If you save 40 minutes/week × 52 weeks = **34.6 hours/year**

**Annual Cost Saved:**  
34.6 hours × $50/hour = **$1,730/year**

---

## Hybrid Approach (Recommended)

For most analysts, I recommend a **hybrid approach**:

### Week 1: Set Up Bookmarked Workflow (5 minutes)

Start saving time immediately.

### Week 2-3: Use Bookmarked Method

Get comfortable with the process.

### Week 4: Evaluate

- **Still taking 45 min/week?** → Upgrade to Power Query
- **JSON structure changes often?** → Stick with bookmarking
- **Doing this daily?** → Consider Python automation

### Month 2: Optimize

If you've saved 10+ hours already, invest 30 minutes to set up Power Query refresh.

---

## Common Pitfalls & Solutions

### Pitfall 1: JSON Structure Changes

**Problem:** Your weekly JSON file suddenly has a different structure (new fields, nested differently).

**Solution:**
- **Bookmarked Workflow:** JsonExport auto-adapts ✅
- **Power Query:** Query breaks ❌ (need to reconfigure)
- **Python Script:** Script fails ❌ (need to update code)

**Best Practice:** Test with a sample file before going live.

---

### Pitfall 2: Authentication Issues

**Problem:** API requires authentication (token expires weekly).

**Solution:**
- **Power Query:** Store credentials in query
- **Python:** Use environment variables for API keys

---

### Pitfall 3: Emailing Reports

**Problem:** You want the Excel file auto-emailed, not just saved.

**Solution:**
- **Python Script:** Built into solution ✅
- **Power Query:** Requires Power Automate (additional setup)
- **Bookmarked Workflow:** Manual email ❌

---

## FAQ

### Q: Can I automate downloads from Salesforce/HubSpot?

**A:** Yes, but you need API access:
- **Salesforce:** Use SOQL query + REST API
- **HubSpot:** Use Deals API
- **Stripe:** Use Transactions API

All return JSON, which you can automate with Python.

### Q: What if my manager wants the report in a specific format?

**A:** 
- **Power Query:** Apply formatting, save as template
- **Python:** Use `openpyxl` to format cells, add charts
- **Bookmarked Workflow:** Manual formatting (but faster than starting from scratch)

### Q: Can I run this on a schedule without my computer?

**A:** Yes, use cloud automation:
- **Azure Functions** (runs Python scripts on schedule)
- **AWS Lambda** (similar to Azure)
- **Google Cloud Functions**

### Q: What if I don't have API access?

**A:** Use the **Bookmarked Workflow** method. Download JSON manually, convert in 2 clicks.

---

## Conclusion: Stop Doing Manual Weekly Reports

If you're spending **30-60 minutes every week** converting JSON to Excel, you're wasting **26-52 hours per year**.

**Start here:**
1. **This week:** Set up Bookmarked Workflow (5 min) → Save 43 min/week
2. **Next month:** If still doing this weekly, upgrade to Power Query
3. **Quarter 2:** If doing daily, invest in Python automation

**ROI:**
- **Bookmarked Workflow:** 5-minute setup saves 37 hours/year
- **Power Query:** 30-minute setup saves 38 hours/year
- **Python Script:** 3-hour setup saves 39 hours/year (+ fully automated)

[Start Automating Your Workflow (Free)](https://jsonexport.com)

---

**Related Guides:**
- [How to Fix '[object Object]' in Excel](/blog/fix-object-object-excel-json)
- [5 Ways to Convert JSON to Excel (Ranked)](/blog/5-ways-convert-json-to-excel-ranked)
- [Best Tool for Large JSON Files](/blog/best-tool-large-json-files-excel)
