# Dyslexia Mode Chrome Extension

A Chrome extension that adds a dyslexia-friendly reading mode to any webpage with **visible, impactful changes**.

## ✨ Features

### Visual Transformations:
- ✅ **OpenDyslexic Font** - Specially designed for dyslexia
- ✅ **Larger Text** - 15% size increase
- ✅ **Better Spacing** - 70% more line height
- ✅ **Letter Spacing** - Extra space between letters
- ✅ **Word Spacing** - Clearer word boundaries
- ✅ **Bionic Reading** - Bold first 35% of each word
- ✅ **Softer Background** - Cream color reduces glare
- ✅ **Reduced Contrast** - Softer text color for less eye strain
- ✅ **Persistent State** - Remembers your preference

### Toggle Button:
- Fixed at top-right corner
- **Blue/Gray** = Inactive
- **Green** = Active
- Click to toggle ON/OFF

## 🎯 What You'll See When Active

### Before (Normal Mode):
```
This is normal text with standard formatting.
```

### After (Dyslexia Mode):
```
𝕋𝕙𝕚𝕤  𝕚𝕤  𝕕𝕪𝕤𝕝𝕖𝕩𝕚𝕒-𝕗𝕣𝕚𝕖𝕟𝕕𝕝𝕪  𝕥𝕖𝕩𝕥.

- Different font (OpenDyslexic)
- Bigger size
- More space between lines
- More space between letters
- More space between words
- **Bol**d first part of each word
- Cream background
- Softer text color
```

## 📦 Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `chrome-extension` folder
5. ✅ Extension is now active!

## 🚀 Usage

1. Visit **any webpage** (try Wikipedia, news sites, etc.)
2. Look for the **"Dyslexia Mode"** button (top-right corner)
3. Click to toggle:
   - **Green** = Dyslexia mode ON
   - **Gray** = Normal mode
4. Changes apply **instantly**
5. Preference **persists** across page reloads

## 🔍 How to Verify It's Working

### Quick Visual Check:
1. Enable dyslexia mode (button turns GREEN)
2. You should **immediately** see:
   - Font looks different (rounder, more distinct letters)
   - Text is noticeably larger
   - Lines are more spread out
   - Background is cream/beige instead of white
   - First part of words is bold

### Technical Verification (DevTools):
1. Right-click on text → **Inspect**
2. Go to **"Computed"** tab
3. Check these values:
   ```
   font-family: "OpenDyslexic" or "Comic Sans MS"
   font-size: ~115% of original
   line-height: 1.7
   letter-spacing: 0.05em
   word-spacing: 0.16em
   background-color: #FEFEF0 (cream)
   color: #2B2B2B (soft dark gray)
   ```

## 🎬 Demo for Judges

### Script:
1. **Show normal webpage**: "Here's a standard webpage"
2. **Click button**: "Watch when I enable dyslexia mode" → Button turns GREEN
3. **Point out changes**:
   - "Font changed to OpenDyslexic"
   - "Text is larger and more spaced"
   - "Background is softer cream color"
   - "First part of words is bold"
4. **Show DevTools**: Right-click → Inspect → Show computed styles
5. **Toggle off/on**: "I can toggle it anytime"
6. **Refresh page**: "Setting persists across reloads"

## 🐛 Troubleshooting

### "I don't see any changes"
**Check:**
- Is the button GREEN? (If gray, it's not active)
- Try on a simple webpage first (Wikipedia works great)
- Check browser console for errors (F12)
- Verify extension is enabled in `chrome://extensions/`

### "Font looks the same"
**Solution:**
- OpenDyslexic loads from CDN (needs internet)
- Falls back to Comic Sans MS if CDN fails
- Check DevTools → Computed → font-family

### "Some text didn't change"
**Expected behavior** - We intentionally skip:
- Code blocks (`<code>`, `<pre>`)
- Input fields (`<input>`, `<textarea>`)
- Scripts and styles
- The toggle button itself

### "Button not visible"
**Solution:**
- Button is at top-right (80px from top, 20px from right)
- Has highest z-index (should be above everything)
- Try scrolling to top of page

## 📊 Technical Details

### Implementation:
- **Manifest Version**: 3 (latest)
- **Permissions**: storage, activeTab
- **Content Script**: Runs on all URLs
- **DOM Traversal**: TreeWalker API (safe & efficient)
- **State Management**: Chrome Storage API
- **Text Transform**: Bionic reading pattern (35% bold)

### Performance:
- ✅ Efficient text node processing
- ✅ Ignores non-text elements
- ✅ Perfect restoration when toggled off
- ✅ No memory leaks
- ✅ Works on dynamic content (SPAs)

## 📁 Files

- `manifest.json` - Extension configuration
- `contentScript.js` - Main logic (text transformation + UI)
- `README.md` - This file
- `DYSLEXIA_MODE_VERIFICATION.md` - Detailed verification guide

## 🎓 Research-Based Features

All features are based on dyslexia research:

1. **OpenDyslexic Font** - Letters have weighted bottoms to prevent flipping
2. **Increased Spacing** - Reduces crowding effect
3. **Bionic Reading** - Helps eyes jump between words faster
4. **Reduced Contrast** - Prevents visual stress
5. **Larger Text** - Easier character recognition

## ✅ Success Criteria

When dyslexia mode is active, you should see:

- [x] Different font (OpenDyslexic or Comic Sans)
- [x] Larger text size (+15%)
- [x] More line spacing (1.7)
- [x] More letter spacing (0.05em)
- [x] More word spacing (0.16em)
- [x] Bold first part of words
- [x] Cream background color
- [x] Softer text color
- [x] Green toggle button
- [x] Persistent across reloads

## 🔗 Resources

- [OpenDyslexic Font](https://opendyslexic.org/)
- [Bionic Reading Research](https://bionic-reading.com/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)

## 📝 Notes

- Works on **any website** (not just your app)
- Does **NOT** modify your frontend codebase
- Handles dynamic content automatically
- Safe for production use
- No external dependencies (except font CDN)

---

**For detailed verification steps and troubleshooting, see `DYSLEXIA_MODE_VERIFICATION.md`**
