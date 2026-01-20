---
title: "Stripe Webhook Data to Excel: Analyze Payments, Refunds & Subscriptions"
date: "2026-01-20"
description: "Export Stripe webhook events to Excel for payment analysis, refund tracking, and subscription metrics. Handle nested JSON from payment_intent, invoice, and subscription objects."
keywords: ["stripe webhook excel", "stripe export data", "stripe analytics excel", "stripe payment data analysis", "stripe json to excel", "stripe subscription reporting"]
---

You're running a business on Stripe. The dashboard shows you what happened yesterday. But for real analysis—cohort retention, refund patterns, revenue forecasting—you need the data in Excel.

Stripe gives you two options: the dashboard CSV export (limited) or the API/webhooks (JSON). If you're capturing webhooks for real-time processing, you're sitting on a goldmine of transaction data that's locked in JSON format.

Here's how to get it into Excel without writing Python scripts.

## What Stripe Webhook Data Looks Like

When Stripe sends a webhook, you get JSON like this:

```json
{
  "id": "evt_1Abc123",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1Xyz789",
      "amount": 4999,
      "currency": "usd",
      "customer": "cus_ABC123",
      "metadata": {
        "order_id": "ORD-2024-001",
        "product_sku": "PRO-MONTHLY"
      },
      "charges": {
        "data": [
          {
            "id": "ch_1Def456",
            "amount": 4999,
            "payment_method_details": {
              "card": {
                "brand": "visa",
                "last4": "4242"
              }
            }
          }
        ]
      }
    }
  }
}
```

**The problem:** This is 3-4 levels deep. Excel's native import shows `[object Object]` for the nested parts.

## The Dashboard Export Limitation

Stripe's built-in export (Payments → Export) gives you:

| What You Get | What's Missing |
|-------------|---------------|
| Transaction ID | Metadata fields |
| Amount | Nested charge details |
| Customer email | Payment method specifics |
| Status | Webhook event type |

For basic bookkeeping, that's fine. For analysis like "which products have the highest refund rate" or "what's the average order value by card type," you need the full JSON.

## Method 1: Export Webhook Logs (Quick)

If you store webhook payloads in a database or log files:

1. Export your webhook events to a JSON file
2. Upload to [JsonExport](https://jsonexport.com)
3. The tool automatically flattens nested structures:
   - `data.object.amount` → separate column
   - `data.object.metadata.order_id` → separate column
   - `charges.data[0].payment_method_details.card.brand` → separate column
4. Download Excel file

**Result:** Every nested field becomes its own column, ready for pivot tables.

## Method 2: Stripe API Export + Conversion

If you haven't been storing webhooks, use the Stripe API:

### Using Stripe CLI
```bash
stripe events list --limit 100 > events.json
```

### Using the Dashboard
1. Developers → Webhooks → select endpoint
2. Click through recent events
3. Copy the JSON payload manually (tedious for many events)

### Better: Use Stripe Data Pipeline (Paid)
Stripe offers Data Pipeline ($0.01/event) to automatically export to your data warehouse. But if you just need occasional Excel reports, that's overkill.

## Real Analysis Use Cases

Once your Stripe data is in Excel, you can answer questions the dashboard can't:

### 1. Refund Rate by Product

**Data needed:**
- Webhook type (`charge.refunded`)
- Product from metadata
- Original amount

**In Excel:**
```
=SUMIF(type_column, "charge.refunded", amount_column) / SUMIF(type_column, "charge.succeeded", amount_column)
```

Group by product using pivot tables.

### 2. Payment Method Distribution

**From the nested data:**
- `payment_method_details.card.brand` → Visa, Mastercard, Amex
- `payment_method_details.type` → card, bank_transfer, etc.

**Pivot table:** Rows = card brand, Values = count and sum of amount

### 3. Customer Lifetime Value

**Required fields:**
- Customer ID
- All payments (filter: `payment_intent.succeeded`)
- Subscription events

**Formula:**
```
=SUMIF(customer_column, [@customer], amount_column)
```

### 4. Churn Analysis (Subscriptions)

**Webhook events to track:**
- `customer.subscription.created`
- `customer.subscription.updated` (check for cancellation)
- `customer.subscription.deleted`

Export these, flatten in JsonExport, then calculate:
```
Churn Rate = Deleted Subscriptions / Active Subscriptions (start of period)
```

## Handling Specific Stripe Objects

### Invoices

Invoice webhooks contain line items as arrays:

```json
{
  "lines": {
    "data": [
      {"description": "Pro Plan", "amount": 2900},
      {"description": "Extra Seats", "amount": 1000}
    ]
  }
}
```

JsonExport creates:
- `lines.data[0].description`
- `lines.data[0].amount`
- `lines.data[1].description`
- `lines.data[1].amount`

For invoices with variable line items, use Power Query to unpivot these columns.

### Subscriptions

Subscription objects have nested `items` and `plan` data:

```json
{
  "items": {
    "data": [
      {
        "plan": {
          "id": "plan_pro_monthly",
          "amount": 2900,
          "interval": "month"
        },
        "quantity": 3
      }
    ]
  }
}
```

After flattening:
- `items.data[0].plan.id` → plan_pro_monthly
- `items.data[0].plan.amount` → 2900
- `items.data[0].quantity` → 3

Now you can calculate MRR: `plan.amount × quantity`

### Disputes

Dispute webhooks contain evidence and reason codes:

```json
{
  "reason": "fraudulent",
  "amount": 9900,
  "evidence": {
    "customer_email_address": "...",
    "product_description": "..."
  }
}
```

Export to Excel → Pivot by `reason` → See which dispute types are most common.

## Automation: Weekly Stripe Reports

If you need this regularly:

### Option 1: Scheduled Webhook Capture

Store webhooks in a simple database (even a Google Sheet via Zapier), then weekly:
1. Export accumulated events
2. Run through JsonExport
3. Append to your master Excel file

### Option 2: Stripe Sigma (Paid)

Stripe Sigma ($10/month) lets you query your data with SQL directly. Good if you need this daily.

### Option 3: Data Pipeline → Excel

For larger operations, Stripe Data Pipeline → Snowflake/BigQuery → Export to Excel.

But for most businesses doing fewer than 10K transactions/month, manual export + JsonExport is faster and free.

## Privacy Note

Stripe webhook data contains:
- Customer emails
- Partial card numbers
- Transaction amounts
- Metadata (which might contain PII)

**JsonExport processes everything client-side:**
- Data never leaves your browser
- No server receives your customer list
- Safe for PCI-adjacent workflows

Unlike uploading to random online converters, your Stripe data stays private.

## When You Need More

JsonExport handles files up to ~1MB smoothly (that's roughly 500-1000 webhook events with full payloads).

**For larger datasets:**
- **Stripe Sigma** - SQL queries directly on Stripe data ($10/month)
- **Fivetran/Airbyte** - ETL to data warehouse, then Excel export
- **Python + Pandas** - For truly large-scale processing

But for weekly/monthly analysis of a typical SaaS business, the manual approach works great.

## Getting Started

1. Export your webhook logs (or use Stripe CLI: `stripe events list`)
2. Upload the JSON to [JsonExport](https://jsonexport.com)
3. Preview the flattened columns
4. Download as Excel
5. Build your pivot tables and charts

No coding. No data warehouse. Just your Stripe data, in Excel, ready for analysis.

---

**Related Guides:**
- [Shopify Order Data to Excel](/blog/convert-stripe-shopify-json-to-csv)
- [Secure JSON Conversion for Financial Data](/security)
- [Why Your Data Should Never Leave Your Browser](/blog/why-you-should-not-upload-json-online)
