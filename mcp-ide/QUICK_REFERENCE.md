# MCP-IDE Quick Reference Card

## 🚀 Quick Start Commands

### Start Everything (Windows)
```cmd
start-dev.bat
```

### Start Everything (macOS/Linux)
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Manual Start

**Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 🔗 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5174 | Main IDE interface |
| Backend | http://localhost:8000 | API server |
| API Docs | http://localhost:8000/docs | Swagger documentation |
| Health Check | http://localhost:8000/health | Server status |
| Ollama | http://localhost:11434 | Local LLM service |

## 📁 Key Files

### Frontend
```
src/pages/IDEPage.tsx       # Main IDE component
src/types/editor.ts         # TypeScript types
src/lib/utils.ts            # Utility functions
```

### Backend
```
app/services/tutor_agent.py # AI tutor logic
app/api/endpoints/tutor.py  # API endpoints
app/core/config.py          # Configuration
app/models/schemas.py       # Data models
```

## 🔧 Common Commands

### Ollama
```bash
# Check if running
ollama list

# Pull model
ollama pull llama3

# Test model
ollama run llama3 "Hello"

# Check API
curl http://localhost:11434/api/tags
```

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py

# Run with auto-reload
uvicorn main:app --reload

# Check health
curl http://localhost:8000/health
```

### Frontend
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐛 Quick Troubleshooting

### Ollama Not Working
```bash
# Check if installed
ollama --version

# Check if running
ollama list

# Restart Ollama
# Windows: Restart from system tray
# macOS/Linux: killall ollama && ollama serve
```

### Backend Errors
```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check if port is in use
# Windows: netstat -ano | findstr :8000
# macOS/Linux: lsof -i :8000
```

### Frontend Errors
```bash
# Check Node version
node --version  # Should be 18+

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## 📊 API Quick Reference

### Ask Tutor
```bash
POST /api/v1/tutor/ask
Content-Type: application/json

{
  "editor_state": {
    "file_path": "main.js",
    "language": "javascript",
    "full_code": "function test() { return 42; }",
    "cursor_line": 1,
    "cursor_column": 1,
    "selected_text": "",
    "errors": []
  },
  "user_question": "What does this do?"
}
```

### Health Check
```bash
GET /api/v1/tutor/health
```

## 🎨 Customization Quick Tips

### Change Editor Theme
```tsx
// In IDEPage.tsx
<Editor
  theme="vs-dark"  // Options: "vs-dark", "light", "vs"
  // ...
/>
```

### Modify Tutor Personality
```python
# In app/services/tutor_agent.py
system_prompt = """
Your custom instructions here...
"""
```

### Change Chat Panel Width
```tsx
// In IDEPage.tsx
<div className="w-[380px]">  // Change 380px to desired width
```

### Update Default Code
```tsx
// In IDEPage.tsx
const INITIAL_CODE = `
// Your default code here
`
```

## 🔍 Debugging Tips

### Check Backend Logs
- Look at terminal where `python main.py` is running
- Check for error messages
- Verify Ollama connection status

### Check Frontend Logs
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls
- Look for failed requests

### Test API Directly
```bash
# Using curl
curl -X POST http://localhost:8000/api/v1/tutor/ask \
  -H "Content-Type: application/json" \
  -d '{"editor_state": {...}, "user_question": "test"}'

# Using Python
python -c "import requests; print(requests.get('http://localhost:8000/health').json())"
```

## 📦 Dependencies

### Frontend
- React 18.3+
- Monaco Editor 0.45+
- Framer Motion 11+
- Tailwind CSS 3.4+
- TypeScript 5.2+

### Backend
- FastAPI 0.109+
- Python 3.10+
- Pydantic 2.5+
- httpx 0.26+

### External
- Ollama (latest)
- Llama 3 model

## 🎯 Common Tasks

### Add New Language Support
1. Update language dropdown in IDEPage.tsx
2. Add language to Monaco Editor config
3. Update tutor prompts for language-specific help

### Change Response Time
```python
# In app/services/tutor_agent.py
async with httpx.AsyncClient(timeout=30.0) as client:
    # Change 30.0 to desired timeout in seconds
```

### Enable Demo Mode
```tsx
// In IDEPage.tsx or create a config
const USE_DEMO_MODE = true

// In handleSend function
if (USE_DEMO_MODE) {
  // Return mock response
}
```

## 🔐 Environment Variables

```bash
# Backend (.env)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5174,http://localhost:3000
```

## 📈 Performance Tips

### Frontend
- Lazy load Monaco Editor
- Debounce context updates
- Cache API responses
- Use code splitting

### Backend
- Enable response caching
- Use connection pooling
- Implement request queuing
- Add rate limiting

### Ollama
- Keep model in memory
- Use GPU if available
- Preload model on startup
- Optimize prompt length

## 🎓 Learning Path

1. **Day 1**: Setup and run locally
2. **Day 2**: Understand architecture
3. **Day 3**: Modify UI components
4. **Day 4**: Customize tutor behavior
5. **Day 5**: Integration planning

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| Ollama not responding | Check if running: `ollama list` |
| Backend won't start | Check Python version and dependencies |
| Frontend errors | Clear node_modules and reinstall |
| API calls failing | Verify backend is running on port 8000 |
| Monaco not loading | Check browser console for errors |
| Slow responses | Check Ollama is using GPU |

## 🎉 Success Indicators

✅ Editor loads without errors
✅ Can type and edit code
✅ Chat sends and receives messages
✅ Responses are educational
✅ No console errors
✅ API calls succeed
✅ Ollama responds quickly

## 📚 Documentation Links

- [Full Setup Guide](SETUP.md)
- [Integration Guide](INTEGRATION.md)
- [Project Summary](PROJECT_SUMMARY.md)
- [Architecture Diagrams](ARCHITECTURE_DIAGRAM.md)
- [Team Checklist](TEAM_CHECKLIST.md)

---

**Pro Tip**: Keep this file open while working on the project for quick reference!
