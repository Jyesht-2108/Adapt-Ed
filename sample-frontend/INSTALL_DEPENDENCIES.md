# Install Additional Dependencies

## Required for Export Notes Feature

The export notes feature requires the jsPDF library to generate PDF files.

### Installation

Run the following command in the `sample-frontend` directory:

```bash
npm install jspdf
```

### What is jsPDF?

jsPDF is a library for generating PDF documents using JavaScript. It allows us to:
- Create PDF files client-side (no server needed)
- Add text with custom formatting
- Handle page breaks automatically
- Download PDFs directly to user's device

### Version

The feature is compatible with jsPDF v2.5.1 or higher.

### Alternative: Manual Installation

If you prefer to add it to package.json manually:

1. Open `package.json`
2. Add to dependencies:
   ```json
   "dependencies": {
     ...
     "jspdf": "^2.5.1"
   }
   ```
3. Run `npm install`

### Verification

After installation, verify it's installed:

```bash
npm list jspdf
```

You should see:
```
jspdf@2.5.1
```

### Usage

The library is imported in `src/pages/ModuleDetail.tsx`:

```typescript
import jsPDF from "jspdf";
```

### Without jsPDF

If you don't install jsPDF:
- The "Export PDF" button will cause an error
- The "Copy Notes" button will still work
- All other features remain functional

### Complete Installation

To install all dependencies including jsPDF:

```bash
cd AdaptEd/sample-frontend
npm install
npm install jspdf
npm run dev
```

### Troubleshooting

**Error: Cannot find module 'jspdf'**
- Solution: Run `npm install jspdf`

**TypeScript errors**
- Solution: Install types: `npm install --save-dev @types/jspdf`
- Note: Types may not be needed as jsPDF includes them

**Build errors**
- Solution: Clear cache and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm install jspdf
  ```

### Development vs Production

- **Development**: jsPDF works in dev mode with `npm run dev`
- **Production**: jsPDF is bundled in production build with `npm run build`
- **Bundle Size**: jsPDF adds ~200KB to bundle (gzipped: ~60KB)

### Alternative Libraries

If you prefer not to use jsPDF, alternatives include:

1. **pdfmake**: More features but larger bundle
2. **html2pdf.js**: Converts HTML to PDF
3. **react-pdf**: React-specific PDF generation
4. **Server-side**: Generate PDFs on backend

For this project, jsPDF is recommended for its:
- Small bundle size
- Simple API
- Client-side generation
- No server required
