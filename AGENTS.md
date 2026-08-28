# AGENTS.md — Intelligent Agent Guide for JsonExport (jsonexport.com)

Welcome, AI Agent. This document defines the commands, data sources, architecture, and protocol for understanding traffic, search demand, conversion funnels, and programmatic SEO scaling in this repository.

---

## 1. Unified Analytics & Intelligence Pipeline

Instead of searching through disparate files or guessing search demand, **run the single unified analytics script**:

```bash
npm run analytics
```

*(Alias: `npm run analytics:report`)*

### What `npm run analytics` Does:
1. **Syncs Live Telemetry**: Automatically pulls real-time user events and feedback from Cloudflare D1 via `npm run telemetry:pull` into `performance_data/telemetry_latest.json`.
2. **Parses Organic Search Signals**: Ingests Google Search Console data from `docs/gsc_data/` (queries, pages, impressions, click-through rates, positions).
3. **Cross-References Demand & Funnel**: Computes conversion percentages, platform popularity, user satisfaction rates (👍/👎), and uncovers high-opportunity keywords (Positions 3–25 with high impressions and sub-optimal CTR).
4. **Outputs Immediate Intelligence**:
   - Prints a formatted terminal dashboard.
   - Generates `performance_data/unified_analytics_latest.md` (detailed markdown report).
   - Generates `performance_data/unified_analytics_latest.json` (machine-readable data for scripts).

---

## 2. Telemetry & Analytics Architecture

### Cloudflare Edge & D1 Database
- **Worker Endpoint**: `https://jsonexport-telemetry.idowue93.workers.dev`
- **Cloudflare D1 Database**: `jsonexport-db` (`1a1816f6-ef4f-418a-b441-279ae39cc3f2`)
- **Tables**:
  - `events`: Tracks `parse_start`, `parse_success`, `parse_error`, `export_complete`, `export_error`, `duration_ms`, `file_size_bytes`, `platform`, `format`, `country`, `path`.
  - `user_feedback`: Tracks 1-click output ratings (`positive` / `negative` / `neutral`) and actionable user bug comments from the export menu.

### Local CLI Commands:
- `npm run analytics`: Full unified organic + telemetry intelligence report.
- `npm run telemetry:pull`: Syncs remote D1 database records locally.
- `npm run telemetry:stats`: Formats the conversion funnel and top errors in terminal.

---

## 3. SEO & Programmatic Converter Scaling Protocol

When planning or creating new programmatic converter pages (e.g. `[platform]-json-to-excel`):

1. **Reconnaissance First**:
   - Run `npm run analytics` to see existing search demand and keyword opportunities.
   - Use Google suggestion / search clustering scripts (e.g. `scratch/recon_keywords.js`) to verify real user demand before creating pages.
2. **Authentic Sample Matrix**:
   - NEVER use placeholder dummy data like `[{ id: 1, name: "test" }]`.
   - Add real platform schema dumps to `lib/converters/platform-samples.ts` (e.g., real Trello boards, Postman collections, Figma design tokens, Jira dumps).
   - Register brand vector icons in `components/ui/BrandIcon.tsx` and `lib/og-utils.tsx`.
3. **Red-to-Green Testing**:
   - All transforms must be unit tested in `lib/converters/platform-transforms.test.ts`.
   - Verify all test suites pass (`npm test`).
   - Verify SEO integrity (`npm run check:seo`).
   - Verify static production build (`npm run build`).

---

## 4. Architectural Invariants & Constraints

1. **100% Client-Side / Zero Backend Cost**:
   - Web converters process data entirely in the browser using Web Workers. No files are uploaded to servers.
   - Telemetry sends only anonymous aggregate operational metrics (format, duration, byte size, error code) — NEVER user payload data.
2. **Next.js Static Export (`output: 'export'`)**:
   - All pages are statically generated SSG pages for high-speed CDN delivery and Tauri desktop bundling.
   - Any `<meta>` tags or script tags needed for desktop webview compatibility reside within the `<body>` in `app/layout.tsx`.
3. **Documentation Integrity**:
   - Never commit sensitive private keys. Keep Tauri signing keys strictly in `.env.local`.
