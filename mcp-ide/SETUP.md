# MCP-IDE Setup Guide

Complete setup instructions for the Context-Aware AI Coding Tutor.

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Ollama (for local LLM)

## Step 1: Install Ollama (Local LLM) - Optional

If you want to use local LLM (Ollama):

### Windows
1. Download from https://ollama.ai/download
2. Run the installer
3. Open terminal and run:
```bash
ollama pull llama3
```

### macOS/Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3
```

Verify Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

## Step 1 Alternative: Use Gemini (Cloud LLM)

If you don't have a machine for Ollama, you can use Gemini instead:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Save it for the backend setup (Step 2)

## Step 2: Backend Setup

```bash
cd mcp-ide/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
# or
cp .env.example .env    # macOS/Linux

# Edit .env and add your Gemini API key (if using Gemini)
# GEMINI_API_KEY=your_actual_api_key_here

# Run the backend
python main.py
```

Backend will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

## Step 3: Frontend Setup

```bash
cd mcp-ide/frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:5174

## Step 4: Verify Everything Works

1. Open http://localhost:5174 in your browser
2. You should see the Monaco Editor with a chat panel
3. Type a question in the chat (e.g., "What does this code do?")
4. The Shadow Tutor should respond with Socratic guidance

## Troubleshooting

### Ollama Not Responding
- Check if Ollama is running: `ollama list`
- Restart Ollama service
- Verify the model is downloaded: `ollama pull llama3`

### Backend Errors
- Check Python version: `python --version` (should be 3.10+)
- Verify all dependencies installed: `pip list`
- Check .env file configuration

### Frontend Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)
- Verify backend is running on port 8000

## Testing the API

### Using curl:
```bash
# Health check
curl http://localhost:8000/health

# Ask tutor
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

## Architecture Overview

```
┌─────────────────┐
│  Monaco Editor  │ ← User writes code
└────────┬────────┘
         │ Captures context (cursor, errors, selection)
         ↓
┌─────────────────┐
│  React Frontend │ ← Sends context + question
└────────┬────────┘
         │ HTTP POST /api/v1/tutor/ask
         ↓
┌─────────────────┐
│  FastAPI Backend│ ← Builds prompt with context
└────────┬────────┘
         │ Calls Ollama API
         ↓
┌─────────────────┐
│  Ollama (Local) │ ← Generates Socratic response
└────────┬────────┘
         │ Returns guidance
         ↓
┌─────────────────┐
│   Chat Panel    │ ← Displays hint (not answer)
└─────────────────┘
```

## Next Steps

1. **Integrate with Main Frontend**: Copy the IDEPage component to AdaptEd/frontend
2. **Add RAG**: Implement vector search for documentation
3. **Error Detection**: Add real-time linting and error markers
4. **Multi-file Support**: Extend context to include imported files
5. **Voice Integration**: Add Whisper for voice-based questions

## Demo Mode

For presentations without Ollama:
1. Set `USE_DEMO_DATA = true` in frontend
2. Backend will return fallback responses
3. All UI features will work normally

## Production Deployment

### Backend
```bash
# Install production server
pip install gunicorn

# Run with gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
# Build for production
npm run build

# Serve with any static server
npx serve -s dist
```

## Support

For issues or questions:
1. Check the logs: Backend terminal and Browser console
2. Verify all services are running
3. Test API endpoints individually
4. Review the architecture docs in `/docs`
