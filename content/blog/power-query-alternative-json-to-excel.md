---
title: "How to Flatten Nested JSON for Excel (Without 'Expand Record' Hell)"
excerpt: "Tired of clicking 'Expand Record' twenty times in Power Query? Learn how to pre-flatten your JSON into a clean Excel table in one click."
date: "2026-01-14"
author: "JsonExport Team"
category: "Excel & Power BI"
---

If you use Power BI or Excel to analyze data from APIs (like Stripe, Shopify, or Twitter), you know the pain of **Nested JSON**.

You import your file, and instead of data, you see a column of `[Record]`, `[List]`, `[Record]`.

## The "Power Query" Struggle

To get your data, you have to:
1.  Click the "Expand" icon.
2.  Uncheck "Use original column name as prefix".
3.  Click OK.
4.  Realize that one of those new columns is *also* a `[Record]`.
5.  Repeat steps 1-3 for every single nested object.

If your JSON is 10 levels deep, you are clicking "Expand" for 20 minutes. And if the API schema changes? Your query breaks.

## The Better Way: One-Click Pre-Flattening

Why do the heavy lifting in Excel? The smarter workflow is to **flatten the data before you import it.**

`jsonExport.com` was built specifically to solve this "Power Query Fatigue".

### How it Works

1.  **Drop your JSON file.**
2.  We automatically detect nested structures (objects inside objects).
3.  Our engine "flattens" them into Dot Notation (`customer.address.city`) automatically.
4.  **Download as Excel.**

When you open our file in Excel, **there are no Records or Lists.** Just clean, flat columns like:
*   `orders.id`
*   `orders.customer.email`
*   `orders.items.0.price`

## Comparison: Time to Analysis

| Task | Power Query Method | **jsonExport Method** |
| :--- | :--- | :--- |
| **Setup Time** | 10-20 mins (Manual Expansion) | **10 Seconds** (Drag & Drop) |
| **Schema Changes** | Breaks Query steps | **Auto-adapts** |
| **Mixed Arrays** | Complex "Expand to New Rows" logic | **Smart Flattening** |
| **Result** | Frustration | **Instant Analysis** |

## Stop Clicking "Expand"

You are a Data Analyst, not a "Data Expander". Let our tool handle the structural cleanup so you can focus on the actual insights.

**[Flatten Your JSON Now (Free)](/)**
