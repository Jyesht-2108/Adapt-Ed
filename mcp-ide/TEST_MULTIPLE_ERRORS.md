# Multiple Error Display Test

## Purpose
Verify that the MCP-IDE correctly captures, displays, and sends multiple errors to the AI tutor.

## Understanding Error Types

### Syntax Errors (Single Error)
**JavaScript/Node.js behavior:** Parser stops at the FIRST syntax error
```javascript
console.log("diff:", diff;   // First syntax error - parser stops here
console.log("Fibonacci:", fibSeq;  // This error won't be reported until first is fixed
```
**Result:** Only ONE syntax error shown (this is correct behavior)

### Runtime Errors (Multiple Errors Possible)
**JavaScript/Node.js behavior:** Code executes until it hits an error, then stops
```javascript
console.log(undefinedVar1);  // ReferenceError - execution stops here
console.log(undefinedVar2);  // Won't execute because previous line threw
```
**Result:** Only ONE runtime error shown (execution stopped)

### Multiple Errors That CAN Be Shown

#### Case 1: Warnings + Errors
```javascript
// Deprecation warnings appear in stderr
const buffer = new Buffer(10);  // Warning
console.log(undefinedVar);  // Error
```
**Result:** Both warning AND error shown in stderr

#### Case 2: Python Multiple Errors (Different Behavior)
```python
# Python can show multiple syntax errors in some cases
def func1()  # Missing colon
    pass

def func2()  # Missing colon  
    pass
```
**Result:** Python may report multiple syntax errors

#### Case 3: Linting/Static Analysis (Future Enhancement)
If we add ESLint or similar:
```javascript
const x = 5;
x = 10;  // Error 1: Assignment to constant
console.log(y);  // Error 2: Undefined variable
console.log(z);  // Error 3: Undefined variable
```
**Result:** Linter can report ALL errors at once

## Test Cases

### Test 1: JavaScript Syntax Error (Single Error Expected)
```javascript
import { sub } from "./new.js";
import { fibonacci } from "./utils.js";

const diff = sub(5, 7)
const fibSeq = fibonacci(7);
console.log("diff:", diff;  // Syntax error here
console.log("Fibonacci:", fibSeq;  // This error won't show until above is fixed
```

**Expected Behavior:**
- ✅ Shows ONE syntax error (line 55)
- ✅ Complete error with stack trace
- ✅ AI tutor receives the error
- ❌ Second syntax error NOT shown (parser stopped)

**This is CORRECT behavior** - fix the first error, then the second will appear.

### Test 2: JavaScript Runtime Errors (Sequential)
```javascript
console.log(undefinedVar1);  // ReferenceError
console.log(undefinedVar2);  // Won't execute
console.log(undefinedVar3);  // Won't execute
```

**Expected Behavior:**
- ✅ Shows ONE runtime error
- ✅ Execution stops at first error
- ❌ Subsequent errors NOT shown (execution stopped)

**This is CORRECT behavior** - JavaScript stops on first uncaught error.

### Test 3: Multiple Errors That WILL Show
```javascript
// Use try-catch to continue execution
try {
  console.log(undefinedVar1);
} catch (e) {
  console.error("Error 1:", e.message);
}

try {
  console.log(undefinedVar2);
} catch (e) {
  console.error("Error 2:", e.message);
}

try {
  console.log(undefinedVar3);
} catch (e) {
  console.error("Error 3:", e.message);
}
```

**Expected Behavior:**
- ✅ All three error messages appear in output
- ✅ Complete error context
- ✅ AI tutor sees all errors

### Test 4: Python Multiple Errors
```python
# Python shows complete traceback
print(undefined1)  # NameError
print(undefined2)  # Won't execute
```

**Expected Behavior:**
- ✅ Shows ONE error with full traceback
- ✅ Traceback includes all stack frames
- ❌ Second error NOT shown (execution stopped)

## Current System Behavior

### What Works ✅
1. **Complete stderr capture** - All output from stderr is captured
2. **Full error display** - Complete error messages with stack traces
3. **AI tutor integration** - AI receives complete error context
4. **Proper formatting** - Line breaks and formatting preserved

### What's Expected Behavior ✅
1. **Single syntax error** - Parser stops at first syntax error
2. **Single runtime error** - Execution stops at first uncaught error
3. **Sequential error discovery** - Fix one error to see the next

### What Could Be Enhanced 🔧
1. **Static analysis** - Add ESLint/Pylint to show ALL potential errors
2. **Error recovery** - Try-catch blocks to continue execution
3. **Multi-pass compilation** - Some languages support this

## How to Test

1. **Test Syntax Error (Current Behavior):**
   ```javascript
   console.log("test", x;
   console.log("test", y;
   ```
   - Run code
   - See ONE syntax error
   - Fix it
   - Run again
   - See NEXT syntax error

2. **Test Runtime Errors with Try-Catch:**
   ```javascript
   try { console.log(var1); } catch(e) { console.error(e.message); }
   try { console.log(var2); } catch(e) { console.error(e.message); }
   try { console.log(var3); } catch(e) { console.error(e.message); }
   ```
   - Run code
   - See ALL three error messages in output

## Conclusion

The system is working **correctly**. The behavior you're seeing is:

1. **JavaScript parser stops at first syntax error** ✅ Expected
2. **Complete error message is shown** ✅ Working
3. **AI tutor receives full error** ✅ Working

To see multiple errors, you need to:
- Fix errors one at a time (syntax errors)
- Use try-catch blocks (runtime errors)
- Add static analysis tools (future enhancement)

## Future Enhancement: Static Analysis

To show ALL errors at once, we could add:

```javascript
// In executor.py, before running code:
// 1. Run ESLint to get all potential errors
// 2. Show linting errors
// 3. Then run code to get runtime errors
```

This would give students a complete picture of all issues before execution.

## Related Files

- `AdaptEd/mcp-ide/backend/app/api/endpoints/executor.py` - Code execution
- `AdaptEd/mcp-ide/frontend/src/pages/IDEPage.tsx` - Error display
- `AdaptEd/mcp-ide/backend/app/services/tutor_agent.py` - AI tutor context

