# JSON Hub - Implementation Plan

## Project Overview

**The Smart JSON Bridge** is a client-side web application that converts complex, nested JSON data into Excel/CSV formats with zero hosting costs. The app runs entirely in the browser, ensuring data privacy and maximum performance.

### Key Features
- Auto-unescape double/triple-encoded JSON
- Flatten deeply nested objects into spreadsheet columns
- Excel-like table preview with cell editing
- Export to CSV, Excel, Word, HTML, and bundled ZIP
- Offline-first architecture with Service Worker
- Mobile-responsive design

## User Review Required

> [!IMPORTANT]
> **Technology Stack Confirmation**
> - **Framework**: Next.js (App Router) with TypeScript
> - **Styling**: Tailwind CSS + Shadcn/UI
> - **State**: Zustand
> - **Testing**: Jest (unit) + Playwright (E2E)
> 
> This stack ensures $0 hosting on Vercel Free Tier and maximum client-side performance.

> [!WARNING]
> **File Size Limits**
> The app will enforce a 10MB upload limit to prevent browser memory issues. Larger files will require graceful error handling with user feedback.

> [!IMPORTANT]
> **Accessibility Commitment**
> All UI components will be WCAG 2.1 AA compliant from the start, including keyboard navigation, ARIA labels, and screen reader support.

## Proposed Changes

### Phase 1: Project Setup & Core Logic

#### [NEW] Project Initialization
- Initialize Next.js 14+ with TypeScript and App Router
- Configure `tsconfig.json` with strict mode
- Set up Tailwind CSS and Shadcn/UI
- Install dependencies:
  - `zustand` - state management
  - `monaco-editor` - code editor
  - `@tanstack/react-table` - virtualized table
  - `xlsx` - Excel export
  - `jszip` - ZIP bundling
  - `json-parse-better-errors` - error reporting
  - `jest` + `@testing-library/react` - unit testing
  - `@playwright/test` - E2E testing

#### [NEW] [smartParse.ts](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/lib/parsers/smartParse.ts)
**Purpose**: Validate and parse JSON with auto-unescape for double-encoded strings

**Key Functions**:
```typescript
export interface ParseResult {
  success: boolean;
  data?: any;
  errors?: ParseError[];
}

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

export function validateAndParse(input: string): ParseResult
```

**Logic**:
1. Attempt `JSON.parse(input)` using `json-parse-better-errors`
2. If result is a string, recursively parse again (auto-unescape)
3. Handle circular references with `JSON.stringify` detection
4. Return detailed errors with line/column numbers
5. Limit recursion depth to 10 to prevent infinite loops

**Testing**:
- Valid JSON objects and arrays
- Double/triple-encoded JSON strings
- Malformed JSON with syntax errors
- Circular reference detection
- Very large objects (1MB+)
- Deeply nested structures (100+ levels)

---

#### [NEW] [flattener.ts](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/lib/parsers/flattener.ts)
**Purpose**: Convert nested JSON objects into flat spreadsheet rows

**Key Functions**:
```typescript
export interface FlattenResult {
  rows: Record<string, any>[];
  schema: string[];
}

export function flattenJSON(data: any): FlattenResult
```

**Logic**:
1. Detect if input is array or single object
2. Recursively traverse nested objects using dot notation (`user.address.city`)
3. Handle arrays by creating indexed columns (`items.0.name`, `items.1.name`)
4. Infer schema from first 50 rows to detect all unique headers
5. Fill missing columns with `null` for consistency
6. Optimize with memoization for repeated structures

**Testing**:
- Simple flat objects
- Deeply nested objects (10+ levels)
- Arrays of objects
- Mixed types (strings, numbers, booleans, null)
- Circular reference handling
- Performance with 100K+ row datasets

---

#### [NEW] [store.ts](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/lib/store/store.ts)
**Purpose**: Zustand global state management

**State Schema**:
```typescript
interface AppState {
  // Input
  rawInput: string;
  isParsed: boolean;
  parseErrors: ParseError[];
  
  // Processed Data
  flatData: Record<string, any>[];
  schema: string[];
  
  // UI State
  activeTab: 'input' | 'preview' | 'export';
  selectedFormat: 'csv' | 'xlsx' | 'docx' | 'html' | 'zip';
  isLoading: boolean;
  downloadProgress: number;
  
  // Configuration
  prettyPrint: boolean;
  rowLimit: number;
  
  // Actions
  setRawInput: (input: string) => void;
  parseInput: () => void;
  flattenData: () => void;
  updateCell: (rowIndex: number, column: string, value: any) => void;
}
```

---

### Phase 2: UI Construction

#### [NEW] [page.tsx](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/app/page.tsx)
**Purpose**: Main application page with three-pane layout

**Layout Structure**:
- Desktop: Resizable panels (Input | Bridge | Preview)
- Mobile: Tabs (Input | Preview | Export)
- Uses Shadcn/UI `ResizablePanelGroup` component

---

#### [NEW] [JsonEditor.tsx](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/components/JsonEditor/JsonEditor.tsx)
**Purpose**: Input pane with Monaco Editor and drag-and-drop

**Features**:
- Monaco Editor with JSON syntax highlighting
- Drag-and-drop file upload area
- File size validation (10MB limit)
- Error display with line/column highlighting
- "Clear" and "Format" buttons

**Accessibility**:
- ARIA labels for file upload zone
- Keyboard shortcuts (Ctrl+V for paste, Ctrl+K for format)
- Screen reader announcements for errors

---

#### [NEW] [ActionBar.tsx](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/components/ActionBar/ActionBar.tsx)
**Purpose**: Central toolbar with validation and formatting controls

**Controls**:
- "Validate" button (triggers parsing)
- "Unescape" toggle (auto-enabled)
- "Pretty Print" / "Minified" toggle
- Status indicator (✓ Valid | ✗ Invalid)

---

#### [NEW] [DataGrid.tsx](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/components/DataGrid/DataGrid.tsx)
**Purpose**: Spreadsheet-like table preview with editing

**Features**:
- TanStack Table v8 with virtualization
- Double-click to edit cells
- Keyboard navigation (arrow keys, Tab, Enter)
- Column sorting and filtering
- Performance optimized for 100K+ rows

**Accessibility**:
- ARIA grid role
- Row/column headers
- Keyboard-only navigation support

---

#### [NEW] [ExportMenu.tsx](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/components/ExportMenu/ExportMenu.tsx)
**Purpose**: Download dropdown with format options

**Options**:
- CSV (`.csv`)
- Excel (`.xlsx`)
- Word (`.docx`)
- HTML (`.html`)
- Download All (`.zip`)

**Features**:
- Progress indicator for large exports
- File naming with timestamp
- Error handling for export failures

---

### Phase 3: Converter Engines

#### [NEW] [jsonToCsv.ts](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/lib/converters/jsonToCsv.ts)
**Purpose**: Convert flat JSON to CSV with proper escaping

**Logic**:
- Escape quotes and commas
- Handle newlines in cell values
- UTF-8 BOM for Excel compatibility
- Return Blob for download

---

#### [NEW] [jsonToXlsx.ts](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/lib/converters/jsonToXlsx.ts)
**Purpose**: Generate real Excel files using SheetJS

**Logic**:
- Create workbook with single sheet
- Auto-size columns based on content
- Apply header styling (bold, background color)
- Return Blob for download

---

#### [NEW] [jsonToDocx.ts](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/lib/converters/jsonToDocx.ts)
**Purpose**: Generate Word document with table

**Logic**:
- Create table with headers
- Apply basic styling
- Return Blob for download

---

#### [NEW] [jsonToHtml.ts](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/lib/converters/jsonToHtml.ts)
**Purpose**: Generate HTML table with styling

**Logic**:
- Create semantic `<table>` with `<thead>` and `<tbody>`
- Apply CSS for readability
- Return HTML string

---

#### [NEW] [zipExporter.ts](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/src/lib/converters/zipExporter.ts)
**Purpose**: Bundle all formats into single ZIP

**Logic**:
- Use JSZip to create archive
- Include CSV, Excel, JSON, HTML files
- Return Blob for download

---

### Phase 4: Polish & Deploy

#### [NEW] [service-worker.js](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/public/service-worker.js)
**Purpose**: Enable offline functionality

**Caching Strategy**:
- Cache static assets (JS, CSS, fonts)
- Network-first for API calls (none in this app)
- Fallback to cache on offline

---

#### [MODIFY] [next.config.js](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/next.config.js)
**Purpose**: Configure Next.js for production

**Changes**:
- Enable PWA support
- Configure Monaco Editor webpack loader
- Optimize bundle size

---

#### [NEW] [.github/workflows/ci.yml](file:///c:/Users/HP/Desktop/Personal%20Websites/json_hub/.github/workflows/ci.yml)
**Purpose**: Automated testing on push

**Jobs**:
- Run Jest unit tests
- Run Playwright E2E tests
- Check TypeScript compilation
- Lint with ESLint

---

## Verification Plan

### Automated Tests

#### Unit Tests (Jest)
**Location**: `src/lib/**/*.test.ts`

**Run Command**:
```bash
npm run test
```

**Coverage Target**: 80%+ on core logic

**Test Suites**:

1. **smartParse.test.ts**
   - Valid JSON parsing
   - Double-encoded JSON auto-unescape
   - Triple-encoded JSON auto-unescape
   - Malformed JSON error reporting
   - Circular reference detection
   - Large object handling (1MB+)
   - Deep nesting (100+ levels)

2. **flattener.test.ts**
   - Simple flat objects
   - Nested objects (dot notation)
   - Arrays of objects (indexed columns)
   - Mixed data types
   - Schema inference from multiple rows
   - Performance benchmark (100K rows in <2s)

3. **jsonToCsv.test.ts**
   - Basic CSV generation
   - Quote escaping
   - Comma escaping
   - Newline handling
   - UTF-8 BOM inclusion

4. **jsonToXlsx.test.ts**
   - Excel file generation
   - Header styling
   - Column auto-sizing
   - Multi-row data

5. **zipExporter.test.ts**
   - ZIP file creation
   - Multiple file inclusion
   - File naming

---

#### E2E Tests (Playwright)
**Location**: `e2e/**/*.spec.ts`

**Run Command**:
```bash
npm run test:e2e
```

**Test Scenarios**:

1. **Happy Path - Simple JSON**
   - Upload valid JSON file
   - Verify table preview displays correctly
   - Download CSV and verify content
   - Download Excel and verify content

2. **Auto-Unescape Flow**
   - Upload double-encoded JSON string
   - Verify auto-unescape triggers
   - Verify flattened data is correct

3. **Error Handling**
   - Upload malformed JSON
   - Verify error message displays with line/column
   - Fix JSON and retry
   - Verify success

4. **Large Dataset**
   - Upload 10K row JSON file
   - Verify table renders without freezing
   - Verify virtualization works (only visible rows rendered)
   - Download ZIP bundle

5. **Mobile Responsiveness**
   - Resize viewport to mobile size
   - Verify tabs appear instead of panels
   - Verify all functionality works on mobile

6. **Cell Editing**
   - Double-click cell in table
   - Edit value
   - Verify change persists in export

7. **Keyboard Navigation**
   - Navigate table with arrow keys
   - Tab through form controls
   - Verify all actions accessible via keyboard

---

### Manual Verification

#### Real-World Data Testing
**Tester**: User or developer

**Steps**:
1. Obtain messy real-world JSON files:
   - Stripe API export
   - Twitter API response
   - Deeply nested configuration file
2. Upload each file to the app
3. Verify parsing succeeds
4. Verify table preview is readable
5. Download Excel and open in Microsoft Excel
6. Verify data integrity

---

#### Accessibility Audit
**Tool**: axe DevTools or Lighthouse

**Steps**:
1. Open app in Chrome DevTools
2. Run Lighthouse accessibility audit
3. Verify score is 90+
4. Fix any identified issues
5. Test keyboard-only navigation:
   - Tab through all controls
   - Use Enter/Space to activate buttons
   - Navigate table with arrow keys
6. Test with screen reader (NVDA or JAWS):
   - Verify all labels are announced
   - Verify table structure is clear

---

#### Performance Testing
**Tool**: Chrome DevTools Performance tab

**Steps**:
1. Upload 100K row JSON file
2. Record performance profile
3. Verify table renders in <3 seconds
4. Verify memory usage stays below 500MB
5. Verify no memory leaks on repeated uploads

---

#### Browser Compatibility
**Browsers**: Chrome, Firefox, Safari, Edge

**Steps**:
1. Test full workflow in each browser
2. Verify Monaco Editor loads correctly
3. Verify downloads work
4. Verify mobile view works on iOS Safari and Chrome Android

---

### Deployment Verification

#### Vercel Deployment
**Steps**:
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy to production
4. Verify app loads at production URL
5. Test full workflow on production

---

#### Error Monitoring Setup
**Tool**: Sentry

**Steps**:
1. Create Sentry project
2. Add Sentry SDK to Next.js app
3. Deploy with Sentry integration
4. Trigger test error
5. Verify error appears in Sentry dashboard

---

## Success Criteria

✅ All unit tests pass with 80%+ coverage  
✅ All E2E tests pass  
✅ Lighthouse accessibility score 90+  
✅ App handles 100K row datasets without freezing  
✅ Deployed to Vercel with zero hosting cost  
✅ Error monitoring active in production  
✅ Mobile-responsive design works on all devices  
✅ Keyboard navigation fully functional  
✅ Real-world messy JSON files parse successfully
