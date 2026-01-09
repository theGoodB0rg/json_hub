# JSON Hub - Task Breakdown

## Phase 1: Core Logic (The "Brain")
- [x] Project Setup
  - [x] Initialize Next.js with TypeScript
  - [x] Configure Tailwind CSS + Shadcn/UI
  - [x] Set up Jest for unit testing
  - [x] Set up Playwright/Cypress for E2E testing
  - [x] Configure Zustand for state management
  - [x] Install core dependencies (monaco-editor, tanstack-table, xlsx, jszip)
  - [x] Create initial directory structure
  - [x] Initialize Git repository and commit initial setup

- [x] Validator Module (`smartParse.ts`)
  - [x] Implement `validateAndParse(input)` function
  - [x] Add auto-unescape logic for double-encoded JSON
  - [x] Use standard error handling for detailed error reporting
  - [x] Handle edge cases (circular references, large objects, deeply nested structures)
  - [x] Write comprehensive unit tests (valid JSON, escaped JSON, malformed input, edge cases)
  - [x] Achieve 100% test coverage (20/20 tests passing)
  - [x] Commit validated module

- [x] Flattener Module (`flattener.ts`)
  - [x] Implement recursive flattening logic for nested objects
  - [x] Add schema inference (scan first 50 rows for unique headers)
  - [x] Optimize for performance with large datasets (100K+ rows)
  - [x] Handle arrays, mixed types, and circular references
  - [x] Write comprehensive unit tests
  - [x] Performance benchmark with large datasets (1000 rows < 1s)
  - [x] Commit validated module

## Phase 2: UI Construction (The "Shell")
- [x] Setup Shadcn/UI Components
  - [x] Install and configure Shadcn/UI
  - [x] Set up Buttons, Toasts, Cards, Resizable Panels
  - [x] Create base layout structure

- [x] Input Component (Pane A)
  - [x] Integrate Monaco Editor for syntax highlighting
  - [x] Add file upload capability
  - [x] Implement error display with line/column numbers
  - [x] Test with various file sizes and formats
  - [x] Commit validated component

- [x] Action Bar (Pane B)
  - [x] Create Parse & Flatten button
  - [x] Add Clear button
  - [x] Add success/error status display
  - [x] Test all controls
  - [x] Commit validated component

- [x] Table Preview (Pane C)
  - [x] Integrate TanStack Table
  - [x] Display flattened data in spreadsheet view
  - [x] Implement cell editing (double-click to edit)
  - [x] Add row/column count display
  - [x] Commit validated component

- [x] Mobile Responsiveness
  - [x] Create resizable panel layout
  - [x] Test on various screen sizes
  - [x] Ensure interactions work properly
  - [x] Commit validated responsive design

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
