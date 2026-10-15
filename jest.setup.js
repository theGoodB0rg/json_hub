import '@testing-library/jest-dom'

// HERMETICITY GUARD — tests must never reach production telemetry.
//
// next/jest loads .env.local, so the real worker URL was in every test run.
// One test that fell through to jsdom's real XHR transport posted 31 phantom
// "Missing changelog" ratings to production D1 (Oct 2026). A per-file guard
// fixed that test; this covers every test written later. `.invalid` is a
// reserved TLD that never resolves, so even a real network request goes nowhere.
// Tests that need a specific URL still set process.env themselves.
process.env.NEXT_PUBLIC_TELEMETRY_URL = 'https://telemetry.test.invalid'
process.env.TELEMETRY_ENDPOINT = 'https://telemetry.test.invalid'
delete process.env.NEXT_PUBLIC_TELEMETRY_TOKEN
delete process.env.TELEMETRY_ADMIN_SECRET
