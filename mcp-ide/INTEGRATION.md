# Integration Guide: MCP-IDE → AdaptEd Frontend

This guide explains how to integrate the MCP-IDE module into the main AdaptEd frontend when ready.

## Overview

The MCP-IDE is built as a standalone module that can be integrated into the main AdaptEd application. It follows the same design patterns and uses compatible technologies.

## Integration Steps

### Step 1: Copy Components

Copy the IDE page component to the main frontend:

```bash
# From the root of the project
cp mcp-ide/frontend/src/pages/IDEPage.tsx AdaptEd/frontend/src/pages/
cp mcp-ide/frontend/src/types/editor.ts AdaptEd/frontend/src/types/
```

### Step 2: Install Dependencies

Add Monaco Editor to the main frontend:

```bash
cd AdaptEd/frontend
npm install @monaco-editor/react monaco-editor
```

### Step 3: Add Route

Update `AdaptEd/frontend/src/App.tsx`:

```tsx
import IDEPage from './pages/IDEPage'

// Add to your routes:
<Route path="/ide" element={<IDEPage />} />
```

### Step 4: Update Navigation

Add IDE link to your sidebar/navigation:

```tsx
import { Code2 } from 'lucide-react'

// In your navigation component:
<NavLink to="/ide" icon={Code2}>
  Code Editor
</NavLink>
```

### Step 5: Configure API Proxy

Update `AdaptEd/frontend/vite.config.ts`:

```ts
export default defineConfig({
  // ... existing config
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

### Step 6: Backend Integration

The MCP-IDE backend can run as a separate service or be integrated into your main backend:

#### Option A: Separate Service (Recommended for Development)
- Run MCP-IDE backend on port 8000
- Run main AdaptEd backend on a different port
- Use different API prefixes

#### Option B: Integrated Backend
Copy the backend modules:

```bash
cp -r mcp-ide/backend/app/services/tutor_agent.py your-backend/app/services/
cp -r mcp-ide/backend/app/api/endpoints/tutor.py your-backend/app/api/endpoints/
```

Update your main API router to include the tutor endpoints.

## Styling Consistency

The MCP-IDE uses the same Tailwind configuration as the main frontend. Key classes used:

- `gradient-primary` - For primary action buttons
- `bg-card` - For card backgrounds
- `border-border` - For borders
- `text-foreground` / `text-muted-foreground` - For text colors

These should already be defined in your main `index.css`.

## State Management

The IDE page is self-contained and doesn't require global state. However, you can integrate it with your existing state management:

### With Zustand (if you're using it):

```tsx
// Create a store for IDE state
import { create } from 'zustand'

interface IDEStore {
  currentFile: string
  setCurrentFile: (file: string) => void
  // ... other state
}

export const useIDEStore = create<IDEStore>((set) => ({
  currentFile: 'main.js',
  setCurrentFile: (file) => set({ currentFile: file }),
}))
```

## API Integration

The IDE communicates with the backend via these endpoints:

- `POST /api/v1/tutor/ask` - Get Socratic guidance
- `GET /api/v1/tutor/health` - Check service health

Create an API service in your main frontend:

```tsx
// AdaptEd/frontend/src/services/ideApi.ts
import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
})

export const ideApi = {
  askTutor: async (payload: ContextPayload) => {
    const response = await api.post('/tutor/ask', payload)
    return response.data
  },
  
  checkHealth: async () => {
    const response = await api.get('/tutor/health')
    return response.data
  },
}
```

## Feature Flags

Add a feature flag to control IDE availability:

```tsx
// In your config or environment
const FEATURES = {
  IDE_ENABLED: import.meta.env.VITE_IDE_ENABLED === 'true',
}

// In your navigation
{FEATURES.IDE_ENABLED && (
  <NavLink to="/ide" icon={Code2}>
    Code Editor
  </NavLink>
)}
```

## Testing Integration

1. **Verify Monaco Editor loads**: Check browser console for errors
2. **Test API connection**: Open Network tab and verify `/api/v1/tutor/ask` calls
3. **Check Ollama connection**: Ensure backend can reach Ollama
4. **Test chat functionality**: Send a message and verify response

## Customization

### Changing the Editor Theme

```tsx
<Editor
  theme="vs-dark"  // or "light", "vs", custom theme
  // ... other props
/>
```

### Adding Language Support

```tsx
// In IDEPage.tsx
const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  // Add more languages
]
```

### Customizing Tutor Behavior

Edit `mcp-ide/backend/app/services/tutor_agent.py`:

```python
system_prompt = """
Your custom tutor instructions here...
"""
```

## Performance Optimization

### Code Splitting

Use React lazy loading for the IDE page:

```tsx
import { lazy, Suspense } from 'react'

const IDEPage = lazy(() => import('./pages/IDEPage'))

// In your routes:
<Route 
  path="/ide" 
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <IDEPage />
    </Suspense>
  } 
/>
```

### Monaco Editor Optimization

Monaco Editor is large (~5MB). Consider:
- Using CDN version for production
- Implementing code splitting
- Lazy loading the editor component

## Troubleshooting

### Monaco Editor Not Loading
- Check if `monaco-editor` is in dependencies
- Verify Vite config includes proper aliases
- Check browser console for module errors

### API Calls Failing
- Verify backend is running on correct port
- Check CORS configuration
- Ensure proxy is configured in vite.config.ts

### Styling Issues
- Ensure Tailwind config includes IDE components
- Check if CSS variables are defined
- Verify `gradient-primary` class exists

## Production Considerations

1. **Ollama Deployment**: 
   - Run Ollama on a dedicated server
   - Update `OLLAMA_BASE_URL` in backend config
   - Consider using a managed LLM service for scale

2. **API Rate Limiting**:
   - Add rate limiting to tutor endpoints
   - Implement request queuing for multiple users

3. **Monitoring**:
   - Log all tutor interactions
   - Track response times
   - Monitor Ollama resource usage

4. **Security**:
   - Validate all user input
   - Sanitize code before sending to LLM
   - Implement authentication for API endpoints

## Next Steps After Integration

1. **Add File Management**: Allow users to create/save multiple files
2. **Implement RAG**: Add vector search for documentation
3. **Error Detection**: Integrate ESLint/Pylint for real-time errors
4. **Collaborative Features**: Add real-time collaboration
5. **Voice Integration**: Add Whisper for voice-based questions

## Support

If you encounter issues during integration:
1. Check the SETUP.md for basic troubleshooting
2. Review the architecture docs in `/docs`
3. Test the standalone version first to isolate issues
4. Verify all dependencies are installed correctly
