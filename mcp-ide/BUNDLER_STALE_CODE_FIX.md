# Bundler Stale Code Fix

## Problem
When executing multi-file projects, the bundler was using **stale/old code from the database** for the current file, even though the code_history table had the correct code.

## Symptoms
- Code_history table shows correct code
- But execution errors show old code with syntax errors
- UI displays old errors
- Happens specifically with multi-file execution (bundling)

## Root Cause

### The Flow Was:
1. User edits `main.js` and fixes syntax error
2. User clicks "Run Code"
3. Frontend saves `main.js` to database
4. Backend receives execution request with `request.code` (correct code)
5. **Backend fetches ALL files from database for bundling**
6. Database query for `main.js` returns **old content** (not updated yet)
7. Bundler uses old code from database
8. Execution fails with old error
9. Code snapshot saves correct code (from `request.code`)

### The Issue:
```python
# In executor.py - OLD CODE
for f in files_list:
    if not f.get('is_folder', False):
        file_ext = Path(f['path']).suffix
        if file_ext in valid_extensions:
            files_dict[f['path']] = f['content']  # ❌ Always uses database content
```

This meant:
- `main.js` from database = old code with error
- `utils.js` from database = correct code
- Bundler combines them
- Executes old `main.js` code
- Shows old error

## Solution

### Use Request Code for Current File
Modified the bundler to use `request.code` for the current file being executed:

```python
# In executor.py - NEW CODE
for f in files_list:
    if not f.get('is_folder', False):
        file_ext = Path(f['path']).suffix
        if file_ext in valid_extensions:
            # CRITICAL: Use code from request for the current file
            # This ensures we use the latest code, not stale database content
            if f['path'] == request.file_path:
                files_dict[f['path']] = request.code  # ✅ Use fresh code from request
            else:
                files_dict[f['path']] = f['content']  # ✅ Use database for other files
```

## How It Works Now

### New Flow:
1. User edits `main.js` and fixes syntax error
2. User clicks "Run Code"
3. Frontend saves `main.js` to database (async)
4. Backend receives execution request with `request.code` (correct code)
5. Backend fetches ALL files from database for bundling
6. **For `main.js`: Uses `request.code` (fresh, correct)**
7. **For other files: Uses database content**
8. Bundler combines them with correct `main.js` code
9. Execution succeeds
10. Code snapshot saves correct code

## Benefits

✅ **Always executes current code** - No more stale code in bundler
✅ **No timing issues** - Doesn't depend on database update speed
✅ **Correct for multi-file** - Other files still use database (correct)
✅ **Consistent behavior** - Single-file and multi-file work the same

## Why This Works

### Request Code is Authoritative
- `request.code` comes directly from the editor
- It's the code the user sees and wants to execute
- It's always the most up-to-date version

### Database is for Other Files
- Other files (`utils.js`, `helpers.js`, etc.) use database
- These files weren't just edited, so database is correct
- No need to send all files in the request

### Best of Both Worlds
- Current file: Fresh from editor (`request.code`)
- Other files: From database (already saved)
- Bundler: Combines both correctly

## Testing

### Test 1: Fix Syntax Error in Main File
1. Edit `main.js`: `console.log("test";` (missing `)`)
2. Click "Run" - see error
3. Fix: `console.log("test");`
4. Click "Run" immediately
5. ✅ Should execute successfully (no error)

### Test 2: Multi-File with Imports
1. Edit `main.js` to import from `utils.js`
2. Edit `utils.js` to export a function
3. Save `utils.js` (Ctrl+S)
4. Edit `main.js` again
5. Click "Run" immediately (without saving `main.js`)
6. ✅ Should use latest `main.js` and saved `utils.js`

### Test 3: Rapid Changes
1. Write: `console.log(1);` in `main.js`
2. Click "Run" - see `1`
3. Change to: `console.log(2);`
4. Click "Run" immediately
5. ✅ Should see `2` (not `1`)

## Edge Cases Handled

### Case 1: Single File Execution
- No bundling needed
- Uses `request.code` directly
- Works as before

### Case 2: File Not in Database Yet
- New file created but not saved
- `files_list` doesn't include it
- Uses `request.code` directly
- Works correctly

### Case 3: File Path Mismatch
- `request.file_path` doesn't match any file in database
- Falls back to using `request.code` directly
- No bundling (single file mode)

## Related Fixes

This fix works together with:
1. **Save-before-execute** - Ensures database is updated (for other files)
2. **Code snapshot fix** - Uses `request.code` for snapshot
3. **Auto-save fix** - Keeps database in sync over time

## Performance Impact

- **None**: Same number of database queries
- **Faster**: No need to wait for database update
- **Reliable**: No race conditions

## Status

✅ Bundler uses request code for current file
✅ Other files use database content
✅ No timing dependencies
✅ Ready for testing

## Verification

After restarting backend, test multi-file execution:
1. Edit `main.js` with syntax error
2. Click "Run" - see error
3. Fix syntax error
4. Click "Run" immediately
5. Should execute successfully with no error
6. Check code_history - should have correct code
7. Check errors field - should be empty or have new errors only
