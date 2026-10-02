# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-10-02
### Added
- **Telemetry `is_sample` Tracking**: Added `is_sample` column to Cloudflare D1 `events` table to isolate automated web crawlers and initial demo template mounting from genuine user file uploads.
- **Worker Batch Ingestion Endpoint**: Added `POST /api/telemetry/batch` endpoint to Cloudflare worker, resolving 404 drops on pending event queue flushes.
- **Unified Analytics Dashboard Breakdown**: Updated `npm run analytics` reporting pipeline to report user uploads vs sample previews distinctly.
- **In-Browser Validation Suite**: Added Playwright and `agent-browser` validation protocols for edge telemetry and CRO testing.

### Fixed
- Fixed silent 404 drops on client export event flushes by aligning worker distribution bundle (`dist.js`) with batch ingestion routes.
- Prevented initial demo template auto-parsing from skewing real user file upload metrics.

## [0.1.0] - 2026-08-16
### Added
- Initial desktop build for Windows.
- PRO license verification logic via Gumroad.
- Web Worker performance optimizations for massive JSON file parsing.
- Nested and flattened data grid views.
