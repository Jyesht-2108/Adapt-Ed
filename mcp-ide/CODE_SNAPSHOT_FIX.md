# Code Snapshot State Issue - Fix

## Problem Identified

The code snapshots are not saving the latest editor state because:

1. **Race Condition**: When user clicks "Run", the frontend sends the code from memory, but the file might not be saved to database yet
2. **Stale Data**: The executor saves `request.code` which might be outdated
3. **Timing Issue**: File updates (PATCH) and code execution (POST) happen asynchronously

## Current Flow (Problematic)

```
User types → Frontend state → Click Run → Send code to executor → Save snapshot
                                                ↓
                                          Uses request.code (might be stale)
```

## Solution Options

### Option 1: Fetch Latest Code from Database (Recommended)
Modify the executor to fetch the latest code from the database before saving snapshot.

**Changes needed in `executor.py`**:
```python
# Instead of:
snapshot_id = await supabase_service.save_code_snapshot(
    code=request.code,  # ❌ Stale code
    ...
)

# Do this:
# Fetch latest code from database
latest_file = await file_service.get_file_by_path(
    project_id=request.project_id,
    file_path=request.file_path
)
latest_code = latest_file['content'] if latest_file else request.code

snapshot_id = await supabase_service.save_code_snapshot(
    code=latest_code,  # ✅ Fresh code from database
    ...
)
```

### Option 2: Force Save Before Execute (Frontend)
Make the frontend save the file before executing.

**Changes needed in frontend**:
```typescript
// Before executing
await saveFile(fileId, editorContent);
await new Promise(resolve => setTimeout(resolve, 100)); // Wait for save
await executeCode(editorContent);
```

### Option 3: Use File ID Instead of Code
Pass file_id to executor and let it fetch the code.

**Changes needed**:
```python
class ExecuteRequest(BaseModel):
    file_id: str  # Instead of code
    language: str
    ...

# In executor:
file = await file_service.get_file(request.file_id)
code_to_execute = file['content']
```

## Recommended Implementation

**Option 1** is best because:
- ✅ No frontend changes needed
- ✅ Always gets latest code
- ✅ Handles race conditions
- ✅ Minimal code changes

## Implementation Steps

### Step 1: Add helper method to file_service

```python
# In file_service.py
async def get_file_by_path(self, project_id: str, file_path: str):
    """Get file by project_id and path"""
    if not self.supabase:
        return None
    
    try:
        response = self.supabase.table('files') \\
            .select('*') \\
            .eq('project_id', project_id) \\
            .eq('path', file_path) \\
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error fetching file by path: {e}")
        return None
```

### Step 2: Update executor to use latest code

```python
# In executor.py, around line 105
if request.session_id:
    print(f"Attempting to save code snapshot for session: {request.session_id}")
    
    # Fetch latest code from database if project_id provided
    code_to_save = request.code
    if request.project_id and request.file_path:
        latest_file = await file_service.get_file_by_path(
            project_id=request.project_id,
            file_path=request.file_path
        )
        if latest_file:
            code_to_save = latest_file['content']
            print(f"✅ Using latest code from database")
        else:
            print(f"⚠️ Could not fetch latest code, using request code")
    
    if supabase_service.is_available():
        snapshot_id = await supabase_service.save_code_snapshot(
            session_id=request.session_id,
            code=code_to_save,  # Use latest code
            language=request.language,
            file_path=request.file_path,
            execution_output=result["output"],
            execution_error=result["error"]
        ) or ""
```

## Testing

After implementing:

1. **Test 1**: Type code, click Run immediately
   - Expected: Latest code is saved
   
2. **Test 2**: Type code, wait, click Run
   - Expected: Latest code is saved
   
3. **Test 3**: Type code quickly, click Run multiple times
   - Expected: Each snapshot has correct code

4. **Test 4**: Check code_history table
   - Expected: Each entry has the actual code that was executed

## Alternative: Frontend Debouncing

If the issue persists, add debouncing in frontend:

```typescript
// Debounce file saves
const debouncedSave = debounce(async (content) => {
  await saveFile(fileId, content);
}, 500); // Wait 500ms after last keystroke

// On editor change
editor.onChange((content) => {
  debouncedSave(content);
});
```

## Verification

Check the logs for:
```
✅ Using latest code from database
```

And verify in Supabase that `code_history.code_content` matches what you see in the editor.

## Status

- [ ] Implement Option 1 (fetch latest code)
- [ ] Test with rapid typing + execution
- [ ] Verify snapshots in database
- [ ] Document in user guide

## Notes

- The current system saves snapshots successfully, but with stale data
- This is a timing/synchronization issue, not a database issue
- The fix is simple and doesn't require schema changes
- Frontend changes are not required
