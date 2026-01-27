---
title: "Python JSON to Excel Tutorial: The Complete Guide (with Code)"
date: "2026-01-28"
description: "How to convert JSON to Excel using Python and Pandas. Step-by-step tutorial for handling nested JSON, arrays, and large files. Includes full code examples."
keywords: ["python json to excel", "pandas json to excel", "json_normalize example", "convert json to excel python", "python flatten json"]
---

If you're a data analyst or developer, Python is often the default tool for data conversion. Its `pandas` library is incredibly powerful.

But if you've ever tried to convert a complex, nested JSON file into a flat Excel sheet, you know it's not always as simple as `pd.read_json()`.

In this tutorial, we'll walk through exactly how to convert JSON to Excel using Python, how to handle the tricky "nested" parts, and when you might want to skip the code entirely.

## Prerequisites

You'll need Python installed and the pandas library.

```bash
pip install pandas openpyxl
```

## Scenario 1: The Simple, Flat JSON

If your JSON looks like a simple list of records:

```json
[
  {"id": 1, "name": "Alice", "role": "Admin"},
  {"id": 2, "name": "Bob", "role": "User"}
]
```

The code is one line:

```python
import pandas as pd

# Read the file
df = pd.read_json('users.json')

# Save to Excel
df.to_excel('users.xlsx', index=False)
```

## Scenario 2: The Nested Nightmare (Real World)

Real data (like from Stripe, Salesforce, or Jira) rarely looks like that. It usually looks like this:

```json
[
  {
    "id": 101,
    "user": {
      "name": "Alice",
      "location": { "city": "NYC", "zip": "10001" }
    },
    "orders": [
      { "id": "A1", "total": 50 },
      { "id": "A2", "total": 100 }
    ]
  }
]
```

If you use `pd.read_json()` on this, your Excel columns will contain `{'name': 'Alice'...}` as text. Useless for analysis.

### Solution: `json_normalize`

To flatten the nested objects, you need `json_normalize`:

```python
import json
import pandas as pd

# Load the raw JSON
with open('data.json') as f:
    data = json.load(f)

# Flatten the data
# sep='_' puts an underscore between parent and child keys (user_location_city)
df = pd.json_normalize(data, sep='_')

# Save
df.to_excel('flattened_data.xlsx', index=False)
```

**What this does:**
*   Creates columns like `user_location_city` and `user_location_zip`.
*   Effectively "flattens" the hierarchy.

## Scenario 3: Handling Lists (The Hard Part)

In our example, `orders` is a list. `json_normalize` by itself won't perfectly flatten lists that cause row expansion (one user -> multiple order rows).

For this, you need the `record_path` argument:

```python
# Flatten just the orders, but keep the user ID
df_orders = pd.json_normalize(
    data, 
    record_path=['orders'], 
    meta=['id', ['user', 'name']]
)
```

This gets complicated quickly if you have multiple lists or deep nesting.

## When to Skip Python

Python is amazing, but it's overkill if:
1.  **You're in a hurry**: Writing and debugging a script for a one-off file takes 15-30 minutes.
2.  **The nesting is messy**: deeply, deeply nested JSON requires complex recursion scripts.
3.  **You're sharing with non-coders**: You can't just hand a `script.py` to your marketing manager.

### The No-Code Alternative: JsonExport

If you just want the data in Excel *now*, without debugging `KeyErrors` or `record_path` parameters, **[JsonExport.com](https://jsonexport.com)** is the faster tool.

*   **Smart Flattening**: It automatically handles the `json_normalize` logic for you, creating clean columns like `user.location.city`.
*   **Array Handling**: It intelligently expands lists or creates separate sheets for clarity.
*   **Zero Setup**: No `pip install`, no environments. Just drag and drop.

**Comparison:**

| Feature | Python (Pandas) | JsonExport |
| :--- | :--- | :--- |
| **Flexibility** | Unlimited | High |
| **Speed (Setup)** | Slow (Write Code) | **Instant** |
| **Large Files** | Excellent | **Excellent (100MB+)** |
| **Cost** | Free (Your Time) | **Free** |

## Summary

*   Use **Python** when you need to automate a transformation pipeline that runs every hour on a server.
*   Use **JsonExport** when you have a file on your desktop and you needed it in Excel 5 minutes ago.

Happy coding!
