# AdaptEd - Professional Dyslexia Mode Chrome Extension

A clean, professional Chrome Extension that toggles dyslexia-friendly reading mode on any webpage.

## Features

✅ **Floating Toggle Button** - Always accessible on every webpage (bottom-right corner)  
✅ **OpenDyslexic Font** - Research-backed typography designed for dyslexic readers  
✅ **Perfect Toggle** - Instantly switch between original and dyslexia mode  
✅ **Reading Ruler** - Yellow highlight bar that follows your cursor  
✅ **Optimized Spacing** - Enhanced line height, letter spacing, and word spacing  
✅ **Persistent Settings** - Your preference is remembered across page reloads  
✅ **Universal Compatibility** - Works on all websites  
✅ **No Toolbar Icon Needed** - Just use the floating button on each page

## Installation

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the AdaptEd project directory

## Usage

1. Visit any website
2. Look for the floating purple toggle button in the bottom-right corner
3. Click the toggle to turn Dyslexia Mode ON
4. The webpage will instantly transform with:
   - OpenDyslexic font
   - Cream background (#FAF9F6)
   - Charcoal text (#333333)
   - Enhanced spacing for readability
   - Yellow reading ruler following your cursor

5. Click the toggle again to turn OFF and revert to original styling

## Technical Details

### Typography Settings (When Active)

- **Font Family**: OpenDyslexic
- **Line Height**: 2.0 (double spacing)
- **Letter Spacing**: 0.15em
- **Word Spacing**: 0.3em
- **Background**: #FAF9F6 (soft cream)
- **Text Color**: #333333 (charcoal)

### How It Works

The extension uses CSS class toggling (`dyslexia-active`) to apply all styling changes. This means:

- ✅ No permanent modifications to the webpage HTML
- ✅ Instant reversion when toggled OFF
- ✅ No conflicts with website functionality
- ✅ Works with dynamic content

### File Structure

```
AdaptEd/
├── manifest.json          # Extension configuration (Manifest V3)
├── content.js            # Toggle logic and reading ruler
├── styles.css            # Dyslexia mode styling + floating button
└── fonts/
    ├── OpenDyslexic-Regular.otf
    └── OpenDyslexic-Bold.otf
```

## Success Criteria

✅ Toggle ON → All text immediately changes to OpenDyslexic with enhanced spacing  
✅ Toggle OFF → Page instantly reverts to original fonts and styling  
✅ Works on all font styles and text elements  
✅ Settings persist across page reloads  
✅ Reading ruler follows cursor when mode is active

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Brave
- Other Chromium-based browsers

## License

MIT License

## Credits

- OpenDyslexic font by Abelardo Gonzalez
- Built for accessibility and ease of use
