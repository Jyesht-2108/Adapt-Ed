# Using Gemini Instead of Ollama

If you don't have a machine capable of running Ollama, you can use Google's Gemini API instead.

## Why Use Gemini?

- ✅ No local installation required
- ✅ Works on any machine (even low-spec)
- ✅ Fast responses
- ✅ Free tier available (60 requests/minute)
- ✅ Powerful model (Gemini 1.5 Flash)

## Setup Steps

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 2. Configure Backend

Edit `mcp-ide/backend/.env`:

```bash
# Gemini Configuration
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# You can leave Ollama config as is (it won't be used)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### 3. Install Dependencies

The Gemini SDK is already in `requirements.txt`:

```bash
cd mcp-ide/backend
pip install -r requirements.txt
```

### 4. Start Backend

```bash
python main.py
```

### 5. Select Model in Frontend

1. Open http://localhost:5174
2. In the chat panel, click the model selector dropdown
3. Select "Gemini 1.5 Flash"
4. Start chatting!

## Model Comparison

| Feature | Ollama (Llama 3) | Gemini 1.5 Flash |
|---------|------------------|------------------|
| **Cost** | Free | Free (with limits) |
| **Privacy** | 100% local | Cloud-based |
| **Speed** | 2-5 seconds | 1-2 seconds |
| **Quality** | Very good | Excellent |
| **Requirements** | 8GB+ RAM, GPU recommended | Internet connection |
| **Rate Limits** | None | 60 req/min (free tier) |

## Switching Between Models

You can switch between Ollama and Gemini at any time:

1. **In the UI**: Use the model selector dropdown in the chat panel
2. **Default Model**: Set in backend `.env` file

The system will automatically use the selected model for each request.

## API Limits (Free Tier)

Gemini Free Tier:
- 60 requests per minute
- 1,500 requests per day
- 1 million tokens per day

This is more than enough for development and testing.

## Troubleshooting

### "Gemini API key not configured"

Make sure:
1. You added `GEMINI_API_KEY` to `.env`
2. The key is not the placeholder `your_gemini_api_key_here`
3. You restarted the backend after editing `.env`

### "Model not available in dropdown"

Check backend health:
```bash
curl http://localhost:8000/api/v1/tutor/health
```

Should show:
```json
{
  "status": "healthy",
  "service": "tutor",
  "ollama_configured": true,
  "gemini_configured": true  // Should be true
}
```

### "Rate limit exceeded"

You've hit the free tier limit. Wait a minute or:
1. Upgrade to paid tier (very cheap)
2. Use Ollama instead
3. Reduce request frequency

### "Invalid API key"

1. Verify the key is correct
2. Check if the key is active in [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Try generating a new key

## Cost Estimation (Paid Tier)

If you exceed free tier:

Gemini 1.5 Flash pricing:
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

Example: 1000 questions with 500 tokens each = ~$0.04

Very affordable for production use!

## Best Practices

### For Development
- Use Gemini (faster iteration)
- No local setup needed
- Easy to test

### For Production
- Use Ollama if you have the infrastructure (privacy + no costs)
- Use Gemini if you want simplicity and scale
- Consider hybrid: Ollama for code, Gemini for concepts

### For Privacy-Sensitive Use Cases
- Use Ollama only
- Student code never leaves their machine
- GDPR/FERPA compliant

## Advanced: Using Both

You can configure both and let users choose:

1. Set up both Ollama and Gemini
2. Users select their preferred model
3. System uses the selected model

This gives maximum flexibility!

## Environment Variables Reference

```bash
# Gemini Configuration
GEMINI_API_KEY=your_key_here          # Required for Gemini
GEMINI_MODEL=gemini-1.5-flash         # Model to use

# Ollama Configuration (optional if using Gemini)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# CORS
CORS_ORIGINS=http://localhost:5174,http://localhost:3000
```

## Testing Your Setup

### Test Gemini Connection

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
    "user_question": "What does this function do?",
    "model_type": "gemini"
  }'
```

Should return a Socratic response!

## Getting Help

If you have issues:
1. Check backend logs for errors
2. Verify API key is correct
3. Test with curl command above
4. Check [Google AI Studio](https://makersuite.google.com/app/apikey) for API status

## Summary

Using Gemini is perfect if you:
- Don't have a powerful machine
- Want fast setup
- Need reliable responses
- Don't mind cloud-based processing

Just get an API key, add it to `.env`, and you're ready to go!
