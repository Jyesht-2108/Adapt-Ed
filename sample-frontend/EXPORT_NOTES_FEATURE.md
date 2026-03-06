# Export Notes Feature

## Overview
Added the ability to export module content as PDF or copy to clipboard from the Module Detail page.

## Features

### 1. Export to PDF
- Generates a formatted PDF document with all module content
- Includes:
  - Module title, description, duration, and difficulty
  - All lesson content (cleaned from markdown)
  - Resources with URLs
  - YouTube videos with links
  - Web scraped articles with summaries
- Automatically downloads with filename: `{Module_Title}_notes.pdf`
- Shows success toast notification

### 2. Copy to Clipboard
- Copies all module content as formatted text
- Includes:
  - Module header information
  - All lessons with full markdown content
  - Resources with descriptions and URLs
  - YouTube videos with channel and links
  - Articles with summaries and URLs
- Shows success toast notification
- Button changes to "Copied!" with checkmark for 2 seconds

## Installation

To use the PDF export feature, you need to install jsPDF:

```bash
cd AdaptEd/sample-frontend
npm install jspdf
```

## Usage

### From Module Detail Page

1. Navigate to any module (e.g., JavaScript Fundamentals)
2. You'll see three buttons in the header:
   - **Copy Notes**: Copies all content to clipboard
   - **Export PDF**: Downloads content as PDF
   - **Take Viva**: Starts viva examination

### Copy Notes
- Click "Copy Notes" button
- Content is copied to clipboard
- Button shows "Copied!" with checkmark
- Paste anywhere (Ctrl+V / Cmd+V)

### Export PDF
- Click "Export PDF" button
- PDF is generated and downloaded
- File saved as `Module_Title_notes.pdf`
- Toast notification confirms success

## Technical Implementation

### PDF Generation
Uses jsPDF library to create formatted PDFs:

```typescript
const exportToPDF = () => {
  const doc = new jsPDF();
  // Add title, description, lessons, resources, etc.
  doc.save(`${moduleTitle}_notes.pdf`);
};
```

Features:
- Automatic page breaks
- Word wrapping for long text
- Different font sizes for headers
- Cleaned markdown (removes formatting symbols)
- Truncated lesson content (500 chars) to keep PDF manageable

### Clipboard Copy
Uses Navigator Clipboard API:

```typescript
const copyToClipboard = () => {
  const content = formatModuleContent();
  navigator.clipboard.writeText(content);
};
```

Features:
- Formatted text with headers and separators
- Full lesson content (not truncated)
- All URLs included
- Structured with sections

## Content Format

### PDF Format
```
Module Title (20pt, bold)
Description (12pt)
Duration | Difficulty (10pt)

Lessons (16pt, bold)
1. Lesson Title (14pt, bold)
   Lesson content... (10pt)

Resources (16pt, bold)
• Resource Title (type) (10pt)
  URL (9pt)

YouTube Videos (16pt, bold)
• Video Title by Channel (10pt)
  URL (9pt)

Articles & Tutorials (16pt, bold)
• Article Title (10pt)
  URL (9pt)
```

### Clipboard Format
```
Module Title
====================

Description

Duration: X weeks | Difficulty: Level

LESSONS
==================================================

1. Lesson Title
---
Full markdown content...

RESOURCES
==================================================

• Resource Title (type)
  Description
  URL

YOUTUBE VIDEOS
==================================================

• Video Title
  Channel: Channel Name
  Duration: X:XX
  Link: URL

ARTICLES & TUTORIALS
==================================================

• Article Title
  Summary
  URL
```

## UI Components

### Button Layout
```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" onClick={copyToClipboard}>
    {copied ? <Check /> : <Copy />}
    {copied ? "Copied!" : "Copy Notes"}
  </Button>
  
  <Button variant="outline" onClick={exportToPDF}>
    <Download />
    Export PDF
  </Button>
  
  <Button onClick={startViva}>
    <Award />
    Take Viva
  </Button>
</div>
```

### Icons Used
- `Copy`: Copy to clipboard icon
- `Check`: Success checkmark
- `Download`: PDF download icon
- `Award`: Viva examination icon

## Error Handling

### PDF Export Errors
- Catches jsPDF errors
- Shows error toast
- Logs error to console
- User can retry

### Clipboard Errors
- Catches clipboard API errors
- Shows error toast
- Logs error to console
- User can retry

## Browser Compatibility

### PDF Export
- Works in all modern browsers
- Requires jsPDF library
- No special permissions needed

### Clipboard Copy
- Requires HTTPS or localhost
- Supported in:
  - Chrome 63+
  - Firefox 53+
  - Safari 13.1+
  - Edge 79+
- May require clipboard permission

## Limitations

### PDF Export
1. **Content Truncation**: Lesson content limited to 500 characters to keep PDF manageable
2. **No Images**: Images from markdown are not included
3. **Code Formatting**: Code blocks shown as `[Code Block]` placeholder
4. **Basic Styling**: Simple text formatting only

### Clipboard Copy
1. **Markdown Preserved**: Full markdown syntax included
2. **Large Content**: May be slow for very large modules
3. **Permission Required**: Browser may ask for clipboard permission

## Future Enhancements

1. **PDF Improvements**:
   - Include images
   - Better code block formatting
   - Syntax highlighting
   - Table of contents
   - Page numbers
   - Custom styling

2. **Export Options**:
   - Export as Markdown file
   - Export as HTML
   - Export selected lessons only
   - Export with/without resources

3. **Clipboard Enhancements**:
   - Copy as HTML
   - Copy as Markdown
   - Copy selected sections only
   - Copy with formatting

4. **Additional Features**:
   - Print preview
   - Email notes
   - Share notes link
   - Save to cloud storage
   - Export to Notion/Evernote

## Testing

### Test PDF Export
1. Navigate to module detail page
2. Click "Export PDF"
3. Check downloaded PDF file
4. Verify content is formatted correctly
5. Check all sections are included

### Test Clipboard Copy
1. Navigate to module detail page
2. Click "Copy Notes"
3. Button should show "Copied!"
4. Paste into text editor
5. Verify content is formatted correctly
6. Check all sections are included

### Test Error Handling
1. Disable clipboard permissions
2. Try copying - should show error toast
3. Mock jsPDF error
4. Try exporting - should show error toast

## Dependencies

```json
{
  "jspdf": "^2.5.1"
}
```

Install with:
```bash
npm install jspdf
```

## Code Location

- **Component**: `src/pages/ModuleDetail.tsx`
- **Functions**: 
  - `exportToPDF()` - PDF generation
  - `copyToClipboard()` - Clipboard copy
- **UI**: Header section with three buttons

## Conclusion

The export notes feature provides users with flexible options to save and share their learning materials. Whether they prefer PDF for offline reading or clipboard for quick pasting, both options are easily accessible from the module detail page.
