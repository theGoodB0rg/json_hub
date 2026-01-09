# JSON Hub - Task Breakdown

## Phase 1: Core Logic (The "Brain")
- [ ] Project Setup
  - [ ] Initialize Next.js with TypeScript
  - [ ] Configure Tailwind CSS + Shadcn/UI
  - [ ] Set up Jest for unit testing
  - [ ] Set up Playwright/Cypress for E2E testing
  - [ ] Configure Zustand for state management
  - [ ] Install core dependencies (monaco-editor, tanstack-table, xlsx, jszip, json-parse-better-errors)
  - [ ] Create initial directory structure
  - [ ] Initialize Git repository and commit initial setup

- [ ] Validator Module (`smartParse.js`)
  - [ ] Implement `validateAndParse(input)` function
  - [ ] Add auto-unescape logic for double-encoded JSON
  - [ ] Integrate `json-parse-better-errors` for detailed error reporting
  - [ ] Handle edge cases (circular references, large objects, deeply nested structures)
  - [ ] Write comprehensive unit tests (valid JSON, escaped JSON, malformed input, edge cases)
  - [ ] Achieve 80%+ code coverage
  - [ ] Commit validated module

- [ ] Flattener Module (`flattener.js`)
  - [ ] Implement recursive flattening logic for nested objects
  - [ ] Add schema inference (scan first 50 rows for unique headers)
  - [ ] Optimize for performance with large datasets (100K+ rows)
  - [ ] Handle arrays, mixed types, and circular references
  - [ ] Write comprehensive unit tests
  - [ ] Performance benchmark with large datasets
  - [ ] Commit validated module

## Phase 2: UI Construction (The "Shell")
- [ ] Setup Shadcn/UI Components
  - [ ] Install and configure Shadcn/UI
  - [ ] Set up Buttons, Toasts, Cards, Resizable Panels
  - [ ] Create base layout structure

- [ ] Input Component (Pane A)
  - [ ] Integrate Monaco Editor for syntax highlighting
  - [ ] Add drag-and-drop file upload area
  - [ ] Implement file size validation (10MB limit)
  - [ ] Add error display with line/column numbers
  - [ ] Test with various file sizes and formats
  - [ ] Commit validated component

- [ ] Action Bar (Pane B)
  - [ ] Create central toolbar
  - [ ] Add "Validate" button
  - [ ] Add "Unescape" toggle
  - [ ] Add "Format" controls (Pretty Print vs Minified)
  - [ ] Test all controls
  - [ ] Commit validated component

- [ ] Table Preview (Pane C)
  - [ ] Integrate TanStack Table v8 with virtualization
  - [ ] Display flattened data in spreadsheet view
  - [ ] Implement cell editing (double-click to edit)
  - [ ] Add keyboard navigation
  - [ ] Ensure ARIA labels and screen reader support
  - [ ] Performance test with large datasets
  - [ ] Commit validated component

- [ ] Mobile Responsiveness
  - [ ] Convert panes to tabs on mobile (Input | Preview | Export)
  - [ ] Test on various screen sizes
  - [ ] Ensure touch interactions work properly
  - [ ] Commit validated responsive design

## Phase 3: Converter Engines (The "Output")
- [ ] Export Modules
  - [ ] Implement `toCSV(data)` with proper escaping
  - [ ] Write unit tests for CSV export
  - [ ] Implement `toExcel(data)` using xlsx library
  - [ ] Write unit tests for Excel export
  - [ ] Implement `toDocx(data)` for Word table generation
  - [ ] Write unit tests for Docx export
  - [ ] Implement `toHTML(data)` for HTML table generation
  - [ ] Write unit tests for HTML export
  - [ ] Commit validated export modules

- [ ] Zip All Feature
  - [ ] Implement JSZip bundling for all formats
  - [ ] Create `export.zip` with CSV, Excel, JSON files
  - [ ] Write unit tests for zip functionality
  - [ ] Test with large datasets
  - [ ] Commit validated feature

- [ ] Export UI
  - [ ] Create download dropdown menu
  - [ ] Add individual format download buttons
  - [ ] Add "Download All" button
  - [ ] Show download progress for large exports
  - [ ] Test all download options
  - [ ] Commit validated UI

## Phase 4: Polish & Deploy
- [ ] Performance Optimization
  - [ ] Implement file size limits (10MB cap)
  - [ ] Add graceful handling for oversized files
  - [ ] Optimize table rendering performance
  - [ ] Test memory usage with large files
  - [ ] Commit optimizations

- [ ] Offline Support
  - [ ] Add Service Worker for offline functionality
  - [ ] Test offline loading
  - [ ] Commit Service Worker

- [ ] Comprehensive Testing
  - [ ] Complete unit test suite (80%+ coverage)
  - [ ] E2E tests for full workflows (upload → preview → download)
  - [ ] Test with real-world messy data (Stripe exports, Twitter API, nested structures)
  - [ ] Run WCAG compliance checks
  - [ ] Test keyboard-only navigation
  - [ ] Fix any identified bugs
  - [ ] Commit test suite and fixes

- [ ] Deployment
  - [ ] Deploy to Vercel (Free Tier)
  - [ ] Set up Sentry for error monitoring
  - [ ] Verify production deployment
  - [ ] Document deployment process

- [ ] Documentation
  - [ ] Create user documentation
  - [ ] Create developer documentation
  - [ ] Update README with usage instructions
  - [ ] Commit documentation
