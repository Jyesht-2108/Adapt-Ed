# File Save Debug Fix

## Issue
Files are not being saved properly to the database when editing in MCP-IDE.

## Root Causes Identified

### 1. Auto-Save Dependency Issue
The auto-save `useEffect` was missing `currentFileId` in its dependency array, which could cause it to use stale values.

**Before:**
```typescript
useEffect(() => {
  if (!isSaved) {
    const timer = setTimeout(() => {
      handleSave()
    }, 2000)
    return () => clearTimeout(timer)
  }
}, [code, isSaved])  // Missing currentFileId!
```

**After:**
```typescript
useEffect(() => {
  if (!isSaved && currentFileId) {
    const timer = setTimeout(() => {
      console.log('🔄 Auto-saving file...', currentFileId)
      handleSave()
    }, 2000)
    return () => clearTimeout(timer)
  }
}, [code, isSaved, currentFileId])  // Added currentFileId
```

### 2. Lack of Debugging Information
There was no logging to track the save flow, making it hard to diagnose issues.

## Changes Made

### Frontend (IDEPage.tsx)

#### 1. Fixed Auto-Save Dependencies
- Added `currentFileId` to dependency array
- Added check to only auto-save when `currentFileId` exists
- Added logging to track auto-save triggers

#### 2. Enhanced handleSave Logging
```typescript
const handleSave = async () => {
  console.log('💾 handleSave called')
  console.log('   Current file ID:', currentFileId)
  console.log('   Code length:', code.length)
  
  // ... save logic ...
  
  if (currentFileId) {
    console.log('📤 Sending PATCH request to database...')
    // ... API call ...
    console.log('✅ File saved to database successfully')
  } else {
    console.warn('⚠️ No currentFileId, skipping database save')
  }
}
```

#### 3. Added handleCodeChange Logging
```typescript
const handleCodeChange = (value: string | undefined) => {
  const newCode = value || ''
  console.log('✏️ Code changed, length:', newCode.length)
  setCode(newCode)
  setIsSaved(false)
  // ...
}
```

### Backend (files.py)
Already has logging:
```python
@router.patch("/files/{file_id}")
async def update_file(file_id: str, request: UpdateFileRequest):
    print(f"📝 Updating file: {file_id}")
    print(f"   Content length: {len(request.content)}")
    # ...
    print(f"✅ File updated successfully: {file_id}")
```

## How to Test

### 1. Restart Frontend
```bash
cd AdaptEd/mcp-ide/frontend
npm run dev
```

### 2. Open Browser Console
Open DevTools (F12) and watch the Console tab

### 3. Edit a File
1. Select a file from the file explorer
2. Make changes in the editor
3. Watch the console logs

### Expected Console Output

#### When Typing:
```
✏️ Code changed, length: 150
✏️ Code changed, length: 151
✏️ Code changed, length: 152
```

#### After 2 Seconds (Auto-Save):
```
🔄 Auto-saving file... 59b8f49a-4129-4c22-a4e0-9758a1c58639
💾 handleSave called
   Current file ID: 59b8f49a-4129-4c22-a4e0-9758a1c58639
   Code length: 152
📤 Sending PATCH request to database...
✅ File saved to database successfully
```

#### Backend Logs:
```
📝 Updating file: 59b8f49a-4129-4c22-a4e0-9758a1c58639
   Content length: 152
🔄 Updating file 59b8f49a-4129-4c22-a4e0-9758a1c58639...
✅ File content updated in database
✅ File updated successfully: 59b8f49a-4129-4c22-a4e0-9758a1c58639
```

### 4. Manual Save (Ctrl+S)
Press Ctrl+S and verify:
```
💾 handleSave called
   Current file ID: 59b8f49a-4129-4c22-a4e0-9758a1c58639
   Code length: 152
📤 Sending PATCH request to database...
✅ File saved to database successfully
```

## Troubleshooting

### Issue: "⚠️ No currentFileId, skipping database save"
**Cause**: No file is selected from the file explorer
**Solution**: Click on a file in the file explorer first

### Issue: "❌ Failed to save to database: 404"
**Cause**: File doesn't exist in database
**Solution**: Check if the file was created properly, or create a new file

### Issue: "❌ Failed to save to database: 500"
**Cause**: Backend error (check backend logs)
**Solution**: Check backend console for detailed error messages

### Issue: Auto-save not triggering
**Cause**: 
- Not typing (no code changes)
- File not selected
- Typing continuously (timer resets every keystroke)

**Solution**: 
- Make sure a file is selected
- Stop typing for 2 seconds
- Or press Ctrl+S to save manually

## Verification Checklist

- [ ] Frontend logs show code changes
- [ ] Auto-save triggers after 2 seconds of inactivity
- [ ] Manual save (Ctrl+S) works
- [ ] Backend receives PATCH request
- [ ] Backend updates database successfully
- [ ] File content persists after page reload
- [ ] Switching files saves current file first

## Additional Notes

### Auto-Save Behavior
- Triggers 2 seconds after last keystroke
- Only saves if file has unsaved changes (`isSaved === false`)
- Only saves if a file is selected (`currentFileId` exists)
- Timer resets on every keystroke

### Manual Save Behavior
- Triggered by Ctrl+S (or Cmd+S on Mac)
- Saves immediately regardless of auto-save timer
- Updates "Saved" timestamp in UI

### File Switching Behavior
- Automatically saves current file before switching
- Loads new file content from database
- Updates editor language based on file extension

## Status

✅ Auto-save dependency fixed
✅ Comprehensive logging added
✅ Ready for testing

## Next Steps

1. Test with the logging enabled
2. If issues persist, check the console logs to identify the exact failure point
3. Share the console logs for further debugging
