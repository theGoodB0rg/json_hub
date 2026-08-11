---
title: "How to Convert JSON to CSV in Python (The Easy Way & The Hard Way)"
date: "2026-08-10"
description: "A complete guide to converting nested JSON to CSV in Python using pandas and the standard library. Plus, a no-code alternative that does it instantly."
keywords: ["json to csv python", "python json to csv", "convert json to csv", "pandas json to csv", "flatten nested json python"]
faqs:
  - question: "How do I convert JSON to CSV in Python?"
    answer: "You can use the built-in 'json' and 'csv' modules for simple data, or use 'pandas.read_json()' and 'to_csv()' for complex or nested data structures."
  - question: "How do I flatten nested JSON in Python?"
    answer: "The easiest way is using 'pandas.json_normalize()'. This function automatically flattens nested dictionaries and lists into a tabular format suitable for a CSV."
  - question: "How to json to csv python without pandas?"
    answer: "You can write a custom recursive function using the standard 'json' and 'csv' libraries to iterate through keys and flatten the hierarchy manually."
---

We've all been there. You request data from an API, expecting a nice, clean table, and instead, you get a 10,000-line nested JSON file that looks like a Russian nesting doll of `{` and `[` brackets.

You need to analyze this data in Excel, which means you need to convert it to a CSV. 

Flattening nested JSON is one of the most annoying chores in data analysis. It's like trying to squash a complex, 3D cardboard box into a perfectly flat 2D square without breaking anything. 

In this guide, we're going to cover exactly how to do this. We'll start with the "I don't actually want to code right now" method, and then we'll dive into the technical Python implementations using both `pandas` and the standard library.

---

> [!TIP]
> **The "TL;DR" Fast Track (No-Code Solution)**
> 
> If you just realized you don't actually want to write a Python script and you just want your CSV file *right now*, you can skip the code entirely.
>
> 1. Go to [JsonExport.com](https://jsonexport.com/json-to-csv).
> 2. Paste your JSON or upload your file.
> 3. Our engine automatically flattens all the nested arrays and objects instantly.
> 4. Click **Download CSV**. 
>
> *(It runs 100% locally in your browser, so your data stays private and secure.)*

---

## Method 1: The Modern Way (Using Pandas)

If you are working in data science or analytics, `pandas` is your best friend. It has a built-in powerhouse function called `json_normalize` designed specifically for flattening semi-structured JSON data into a flat DataFrame.

### Step 1: Install Pandas
If you haven't already, install pandas in your environment:
```bash
pip install pandas
```

### Step 2: The Code

Let's say we have this nested JSON file (`data.json`):
```json
{
  "employees": [
    {
      "id": 1,
      "name": "Alice",
      "contact": { "email": "alice@company.com", "phone": "555-0100" }
    },
    {
      "id": 2,
      "name": "Bob",
      "contact": { "email": "bob@company.com", "phone": "555-0200" }
    }
  ]
}
```

Here is the Python code to flatten it and export to CSV:

```python
import pandas as pd
import json

# 1. Load the JSON file
with open('data.json', 'r') as f:
    raw_data = json.load(f)

# 2. Normalize (flatten) the nested data
# We specify 'employees' as the record path because that's our main array
df = pd.json_normalize(raw_data, record_path=['employees'])

# 3. Export to CSV
df.to_csv('output.csv', index=False)
```

**The Resulting CSV:**
Notice how `pandas` automatically combined the nested keys! `contact.email` and `contact.phone` became their own columns.

| id | name | contact.email | contact.phone |
|---|---|---|---|
| 1 | Alice | alice@company.com | 555-0100 |
| 2 | Bob | bob@company.com | 555-0200 |

### Pros & Cons of Pandas
* **Pros:** Extremely fast, handles most nesting automatically, powerful data manipulation.
* **Cons:** Requires installing a large third-party library. Can struggle with extremely deep, erratic arrays if not configured carefully.

---

## Method 2: The Old School Way (Standard Library Only)

Sometimes you are working in a restricted environment (like an AWS Lambda function or a strict corporate server) where you cannot easily `pip install pandas`. 

In these cases, you have to use Python's built-in `json` and `csv` modules. Because there is no magic `json_normalize` function here, you have to write a custom recursive function to flatten the nested dictionaries yourself.

### The Code

```python
import json
import csv

def flatten_json(y):
    """
    A recursive function to flatten nested dictionaries.
    """
    out = {}

    def flatten(x, name=''):
        # If the node is a dictionary, iterate through its keys
        if type(x) is dict:
            for a in x:
                flatten(x[a], name + a + '.')
        # If the node is a list, iterate through its items
        elif type(x) is list:
            i = 0
            for a in x:
                flatten(a, name + str(i) + '.')
                i += 1
        # Base case: it's a standard value (string, int, etc.)
        else:
            out[name[:-1]] = x

    flatten(y)
    return out

# 1. Load the JSON data
with open('data.json', 'r') as f:
    data = json.load(f)

# Assuming our data is a list of records under the 'employees' key
records = data.get('employees', [])

# 2. Flatten each record
flattened_records = [flatten_json(record) for record in records]

# 3. Extract the headers (all unique keys across all records)
headers = set()
for record in flattened_records:
    headers.update(record.keys())
headers = sorted(list(headers))

# 4. Write to CSV
with open('output.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    for record in flattened_records:
        writer.writerow(record)
```

### Pros & Cons of the Standard Library
* **Pros:** No external dependencies. Works on any Python installation instantly.
* **Cons:** You have to maintain your own flattening logic. Much slower than pandas for massive files.

---

## Dealing with Massive JSON Files

If your JSON file is larger than your computer's RAM (e.g., a 10GB export from MongoDB), both of the methods above will crash with a `MemoryError` because they try to load the entire file into memory at once.

If you are dealing with massive files, you have two choices:
1. **Use `ijson`:** A Python library that iteratively parses JSON files stream-by-stream instead of loading them all into RAM.
2. **Use JsonExport:** Our browser-based tool is specifically engineered to handle large JSON files using a streaming parser directly in your web browser.

## Summary

Converting JSON to CSV in Python is a rite of passage for data analysts. If you have the luxury of using `pandas`, `json_normalize` makes it incredibly easy. If you are stuck with the standard library, a simple recursive flattening function will do the trick.

But remember, just because you *can* write a script to do it, doesn't mean you *should* spend your time doing it. Next time you get hit with a nasty nested JSON file, save yourself 15 minutes and just drop it into [JsonExport](https://jsonexport.com).
