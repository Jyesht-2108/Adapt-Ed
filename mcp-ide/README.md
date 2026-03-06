# MCP-IDE Module

**Context-Aware AI Coding Tutor** - A Cursor-like AI assistance system for web-based learning.

> 🎯 Built for AdaptEd | 🔒 Privacy-First | 🎓 Educational Focus

## What is This?

MCP-IDE is a standalone web-based code editor with an AI tutor that:
- ✅ Understands your code context (cursor position, errors, selections)
- ✅ Provides Socratic guidance (asks questions, doesn't give answers)
- ✅ Runs locally for privacy (no cloud API costs)
- ✅ Integrates easily into existing applications

Think **Cursor IDE** meets **Educational AI Tutor** in your browser.

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ and Python 3.10+
- **Choose one:**
  - [Ollama](https://ollama.ai/download) for local LLM (requires 8GB+ RAM)
  - [Gemini API Key](https://makersuite.google.com/app/apikey) for cloud LLM (works on any machine)

### One-Command Start

**Windows:**
```cmd
start-dev.bat
```

**macOS/Linux:**
```bash
chmod +x start-dev.sh && ./start-dev.sh
```

Then open: http://localhost:5174

### Manual Start

**Option A: Using Ollama (Local)**
```bash
ollama pull llama3
```

**Option B: Using Gemini (Cloud)**
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `backend/.env`: `GEMINI_API_KEY=your_key_here`

See [GEMINI_SETUP.md](GEMINI_SETUP.md) for detailed Gemini setup.

2. **Start Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

3. **Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Commands, URLs, quick tips |
| [SETUP.md](SETUP.md) | Detailed setup instructions |
| [GEMINI_SETUP.md](GEMINI_SETUP.md) | Using Gemini instead of Ollama |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Complete project overview |
| [INTEGRATION.md](INTEGRATION.md) | How to integrate with AdaptEd |
| [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) | Visual architecture |
| [TEAM_CHECKLIST.md](TEAM_CHECKLIST.md) | Team onboarding checklist |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | What's done, what's next |
| [database/README.md](database/README.md) | Database schema & RAG setup |

## 🎯 Key Features

### For Students
- 💬 Chat with AI tutor about your code
- 🎓 Get Socratic guidance (not direct answers)
- 🔍 Context-aware help based on cursor position
- 🚫 Educational guardrails prevent cheating

### For Developers
- 🎨 Monaco Editor (VS Code in browser)
- ⚡ Fast local LLM (Ollama)
- 🔌 Easy API integration
- 📦 Standalone or integrated deployment

### For Privacy
- 🔒 All code analysis runs locally (with Ollama)
- 🏠 No cloud API calls required (optional Gemini)
- 🛡️ GDPR/FERPA compliant by design
- 🔐 Student code never leaves their machine (Ollama mode)

## 🏗️ Architecture

```
┌─────────────────┐
│  Monaco Editor  │ ← User writes code
└────────┬────────┘
         │ Captures context
         ↓
┌─────────────────┐
│  React Frontend │ ← Sends to backend
└────────┬────────┘
         │ HTTP POST
         ↓
┌─────────────────┐
│  FastAPI Backend│ ← Builds prompt
└────────┬────────┘
         │ Calls Ollama
         ↓
┌─────────────────┐
│  Ollama (Local) │ ← Generates response
└────────┬────────┘
         │ Returns guidance
         ↓
┌─────────────────┐
│   Chat Panel    │ ← Displays hint
└─────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Editor** | Monaco Editor | VS Code quality in browser |
| **Frontend** | React 19 + TypeScript | Modern, type-safe |
| **Backend** | FastAPI + Python | Fast, async, documented |
| **AI** | Ollama + Llama 3 (Local) OR Gemini (Cloud) | Local privacy or cloud convenience |
| **Styling** | Tailwind CSS | Rapid development |

## 📊 Project Structure

```
mcp-ide/
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/IDEPage.tsx    # Main IDE component
│   │   ├── types/editor.ts      # TypeScript types
│   │   └── lib/utils.ts         # Utilities
│   └── package.json
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/endpoints/       # API routes
│   │   ├── services/            # Business logic
│   │   ├── models/              # Data models
│   │   └── core/                # Configuration
│   ├── requirements.txt
│   └── main.py
│
└── docs/                     # All documentation
```

## 🎓 How It Works

1. **Student writes code** in Monaco Editor
2. **System captures context**: cursor position, errors, selections
3. **Student asks question** in chat
4. **Backend builds prompt** with code context
5. **Ollama generates** Socratic response
6. **Student receives hint** (not the answer)

## 🔗 Integration with AdaptEd

This module is designed to integrate seamlessly:

```bash
# Copy to main frontend
cp -r mcp-ide/frontend/src/pages/IDEPage.tsx AdaptEd/frontend/src/pages/

# Add route
<Route path="/ide" element={<IDEPage />} />
```

See [INTEGRATION.md](INTEGRATION.md) for complete guide.

## 🧪 Testing

### Quick Test
1. Open http://localhost:5174
2. Type some code in the editor
3. Ask "What does this code do?"
4. Should receive Socratic guidance

### API Test
```bash
curl -X POST http://localhost:8000/api/v1/tutor/ask \
  -H "Content-Type: application/json" \
  -d '{
    "editor_state": {
      "file_path": "test.js",
      "language": "javascript",
      "full_code": "function test() { return 42; }",
      "cursor_line": 1,
      "cursor_column": 1,
      "selected_text": "",
      "errors": []
    },
    "user_question": "What does this function do?"
  }'
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Ollama not responding | Run `ollama list` to check |
| Backend won't start | Check Python version (3.10+) |
| Frontend errors | Clear node_modules and reinstall |
| API calls failing | Verify backend on port 8000 |

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for more.

## 📈 What's Next?

### Completed ✅
- Monaco Editor integration
- Context capture
- AI tutor with Socratic prompting
- Local LLM integration
- Chat interface

### In Progress 🚧
- RAG for documentation
- Multi-file support
- Error detection enhancement

### Planned 📋
- Voice input (Whisper)
- Code execution sandbox
- Collaborative editing
- Mobile support

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for details.

## 🤝 Contributing

1. Read [TEAM_CHECKLIST.md](TEAM_CHECKLIST.md)
2. Set up local environment
3. Pick a task from [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
4. Make changes and test
5. Submit for review

## 📞 Support

- 📖 Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) first
- 🔧 Review [SETUP.md](SETUP.md) for setup issues
- 🏗️ See [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) for design questions
- 📚 Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for overview

## 🎯 Success Metrics

- ✅ Editor loads without errors
- ✅ Can type and edit code
- ✅ Chat sends and receives messages
- ✅ Responses are educational (not direct answers)
- ✅ No console errors
- ✅ Fast response times (< 5 seconds)

## 📄 License

Part of the AdaptEd project.

## 🙏 Acknowledgments

Built following the architecture specifications in:
- `docs/ai_assisted_web_ide_architecture.md`
- `docs/ai_web_ide_implementation_stories.md`

Inspired by Cursor IDE and educational AI principles.

---

**Ready to start?** Run `start-dev.bat` (Windows) or `./start-dev.sh` (macOS/Linux)

**Need help?** Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**Want to integrate?** Read [INTEGRATION.md](INTEGRATION.md)
