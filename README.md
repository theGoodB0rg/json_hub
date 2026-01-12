# JsonExport

**The Smart JSON Bridge** - Convert complex JSON to Excel/CSV with auto-unescape and flattening.

A client-side web application that transforms nested, double-encoded JSON into clean spreadsheet formats. Perfect for developers dealing with messy API responses, database exports, or deeply nested data structures.

## ✨ Features

- **🔄 Auto-Unescape**: Automatically detects and unescapes double/triple-encoded JSON strings
- **📊 Smart Flattening**: Converts nested objects into flat spreadsheet rows using dot notation
- **🎨 Monaco Editor**: Professional JSON editing with syntax highlighting
- **📁 Multiple Export Formats**: CSV, Excel, HTML, or download all in a ZIP
- **⚡ Client-Side Only**: All processing happens in your browser - your data never leaves your machine
- **🎯 Drag & Drop**: Upload JSON files by dragging them into the editor
- **🔍 Error Detection**: Detailed error messages with line and column numbers
- **✏️ Editable Tables**: Double-click any cell to edit values before export
- **📦 10MB File Support**: Handle large JSON files with ease

## 🚀 Quick Start

### Online (Recommended)

Visit [json-hub.vercel.app](https://json-hub.vercel.app) - no installation required!

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/json_hub.git
cd json_hub

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📖 Usage

1. **Input JSON**: Paste JSON or upload a file (drag & drop supported)
2. **Parse & Flatten**: Click the button to process your JSON
3. **Review Table**: View and edit the flattened data
4. **Export**: Download as CSV, Excel, HTML, or all formats in a ZIP

### Example

**Input** (nested JSON):
```json
{
  "user": {
    "name": "John Doe",
    "address": {
      "city": "New York",
      "zip": "10001"
    }
  },
  "items": ["apple", "banana"]
}
```

**Output** (flattened):
| user.name | user.address.city | user.address.zip | items.0 | items.1 |
|-----------|-------------------|------------------|---------|---------|
| John Doe  | New York          | 10001            | apple   | banana  |

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Static Export)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **State**: Zustand
- **Editor**: Monaco Editor (VS Code editor)
- **Table**: TanStack Table v8
- **Export**: SheetJS (xlsx), JSZip
- **Testing**: Jest + Playwright

## 🏗️ Project Structure

```
json_hub/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── JsonEditor/       # Monaco editor component
│   ├── DataGrid/         # Table preview component
│   └── ExportMenu/       # Export controls
├── lib/
│   ├── parsers/          # Core parsing logic
│   │   ├── smartParse.ts # JSON validator with auto-unescape
│   │   └── flattener.ts  # Nested object flattener
│   ├── converters/       # Export converters
│   │   ├── jsonToCsv.ts
│   │   ├── jsonToXlsx.ts
│   │   ├── jsonToHtml.ts
│   │   └── zipExporter.ts
│   └── store/            # Zustand state management
└── types/                # TypeScript type definitions
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

## 📊 Test Coverage

- **smartParse**: 20/20 tests passing (100%)
- **flattener**: 21/21 tests passing (100%)
- **converters**: 11/12 tests passing (92%)
- **Overall**: 52/53 tests passing (98%)

## 🌟 Key Features Explained

### Auto-Unescape

Handles double or triple-encoded JSON automatically:
```javascript
// Input: "{\"name\":\"John\"}"
// Output: {name: "John"}
```

### Dot Notation Flattening

Converts nested structures to spreadsheet-friendly format:
```javascript
// Input: {user: {address: {city: "NYC"}}}
// Output: {"user.address.city": "NYC"}
```

### Circular Reference Detection

Safely handles circular references without crashing:
```javascript
const obj = {name: "Test"};
obj.self = obj; // Detected and handled gracefully
```

## 🚢 Deployment

### Deployment (GitHub Pages & Vercel)

**GitHub Pages (Automated)**:
This repo includes a GitHub Action to automatically deploy to GitHub Pages.
1. Go to your repository **Settings > Pages**.
2. Under "Build and deployment", select **GitHub Actions** as the source.
3. Push to `main`, and it will deploy automatically!

**Vercel (Recommended for Speed)**:
Connect your repository to Vercel for instant deployments. Note: To use AdSense, you must use a **Pro** plan or a custom domain, as Vercel Hobby plans do not support commercial activity.

### 💰 Monetization & SEO Setup

1. **AdSense**: 
   - Open `public/ads.txt` and replace the content with your AdSense details.
   - Open `app/layout.tsx` and replace `ca-pub-XXXXXXXXXXXXXXXX` with your Publisher ID.
2. **PWA**: 
   - Edit `public/manifest.json` to customize your app's installable name and theme.
3. **SEO**: 
   - Update `app/layout.tsx` metadata with your custom domain URL (`https://yourdomain.com`).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Monaco Editor by Microsoft
- TanStack Table by Tanner Linsley
- SheetJS for Excel export
- Shadcn/UI for beautiful components

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Made with ❤️ for developers dealing with messy JSON**
