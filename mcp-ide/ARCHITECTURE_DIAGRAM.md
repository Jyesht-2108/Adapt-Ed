# MCP-IDE Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    React Frontend                       │ │
│  │                                                          │ │
│  │  ┌──────────────┐              ┌──────────────┐        │ │
│  │  │   Monaco     │              │    Chat      │        │ │
│  │  │   Editor     │◄────────────►│   Panel      │        │ │
│  │  │              │              │              │        │ │
│  │  │  - Code      │              │  - Messages  │        │ │
│  │  │  - Cursor    │              │  - Input     │        │ │
│  │  │  - Errors    │              │  - Send      │        │ │
│  │  └──────┬───────┘              └──────┬───────┘        │ │
│  │         │                             │                │ │
│  │         └─────────────┬───────────────┘                │ │
│  │                       │                                │ │
│  │              ┌────────▼────────┐                       │ │
│  │              │  Context State  │                       │ │
│  │              │  Management     │                       │ │
│  │              └────────┬────────┘                       │ │
│  └───────────────────────┼──────────────────────────────┘ │
└────────────────────────────┼─────────────────────────────┘
                             │ HTTP POST
                             │ /api/v1/tutor/ask
                             │
┌────────────────────────────▼─────────────────────────────┐
│                    FastAPI Backend                        │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              API Endpoint Layer                       │ │
│  │         POST /api/v1/tutor/ask                       │ │
│  └────────────────────┬─────────────────────────────────┘ │
│                       │                                    │
│  ┌────────────────────▼─────────────────────────────────┐ │
│  │           Tutor Agent Service                         │ │
│  │                                                        │ │
│  │  1. Build Context from Editor State                  │ │
│  │  2. Create Socratic Prompt                           │ │
│  │  3. Call Ollama API                                  │ │
│  │  4. Parse Response                                   │ │
│  └────────────────────┬─────────────────────────────────┘ │
└────────────────────────┼──────────────────────────────────┘
                         │ HTTP POST
                         │ /api/generate
                         │
┌────────────────────────▼──────────────────────────────────┐
│                    Ollama (Local LLM)                      │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Llama 3 Model                            │ │
│  │                                                        │ │
│  │  - Receives prompt with code context                 │ │
│  │  - Generates Socratic response                       │ │
│  │  - Returns educational guidance                      │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
┌──────┐         ┌──────────┐         ┌─────────┐         ┌────────┐
│ User │         │ Frontend │         │ Backend │         │ Ollama │
└──┬───┘         └────┬─────┘         └────┬────┘         └───┬────┘
   │                  │                    │                   │
   │ Types code       │                    │                   │
   ├─────────────────►│                    │                   │
   │                  │                    │                   │
   │                  │ Captures context   │                   │
   │                  │ (cursor, errors)   │                   │
   │                  │                    │                   │
   │ Asks question    │                    │                   │
   ├─────────────────►│                    │                   │
   │                  │                    │                   │
   │                  │ POST /tutor/ask    │                   │
   │                  │ {editor_state,     │                   │
   │                  │  user_question}    │                   │
   │                  ├───────────────────►│                   │
   │                  │                    │                   │
   │                  │                    │ Build prompt      │
   │                  │                    │ with context      │
   │                  │                    │                   │
   │                  │                    │ POST /api/generate│
   │                  │                    ├──────────────────►│
   │                  │                    │                   │
   │                  │                    │                   │ Generate
   │                  │                    │                   │ response
   │                  │                    │                   │
   │                  │                    │ ◄─────────────────┤
   │                  │                    │ Socratic response │
   │                  │                    │                   │
   │                  │ ◄──────────────────┤                   │
   │                  │ {response, hints}  │                   │
   │                  │                    │                   │
   │ ◄────────────────┤                    │                   │
   │ Display response │                    │                   │
   │                  │                    │                   │
```

## Component Architecture

### Frontend Components

```
IDEPage (Main Container)
│
├── Header
│   ├── Logo
│   ├── Title
│   └── Status Indicator
│
├── Chat Panel (30% width)
│   ├── Header
│   │   ├── Bot Icon
│   │   ├── Title
│   │   └── Description
│   │
│   ├── Messages Container
│   │   └── Message[]
│   │       ├── Avatar
│   │       └── Content
│   │
│   └── Input Area
│       ├── Text Input
│       └── Send Button
│
└── Editor Panel (70% width)
    ├── File Header
    │   ├── File Icon
    │   ├── File Name
    │   └── Cursor Position
    │
    ├── Monaco Editor
    │   ├── Code Content
    │   ├── Line Numbers
    │   ├── Syntax Highlighting
    │   └── Error Markers
    │
    └── Status Bar (optional)
        └── Error Messages
```

### Backend Services

```
FastAPI Application
│
├── API Router
│   └── /api/v1
│       └── /tutor
│           ├── POST /ask
│           └── GET /health
│
├── Services
│   └── TutorAgent
│       ├── build_context()
│       ├── build_prompt()
│       ├── get_guidance()
│       └── _get_fallback_response()
│
├── Models
│   ├── EditorState
│   ├── ContextPayload
│   ├── TutorResponse
│   └── ChatMessage
│
└── Core
    ├── Config (settings)
    └── CORS middleware
```

## Context Capture Flow

```
Monaco Editor Events
│
├── onDidChangeModelContent
│   └── Update full_code
│
├── onDidChangeCursorPosition
│   └── Update cursor_line, cursor_column
│
├── onDidChangeCursorSelection
│   └── Update selected_text
│
└── onDidChangeMarkers
    └── Update errors[]

                ↓

        EditorState Object
        {
          file_path: string
          language: string
          full_code: string
          cursor_line: number
          cursor_column: number
          selected_text: string
          errors: string[]
        }

                ↓

        Sent to Backend
        with user_question
```

## Prompt Building Process

```
Input: EditorState + user_question
│
├── System Prompt
│   ├── Role: "You are a Socratic Tutor"
│   ├── Rules:
│   │   ├── Never write code
│   │   ├── Never give direct answers
│   │   ├── Ask guiding questions
│   │   └── Keep responses under 100 words
│   └── Behavior guidelines
│
├── Context Section
│   ├── File information
│   ├── Language
│   ├── Cursor position
│   ├── Code content
│   ├── Selected text (if any)
│   └── Errors (if any)
│
└── User Question
    └── "Student Question: {question}"

                ↓

        Complete Prompt
        (sent to Ollama)

                ↓

        Socratic Response
        (returned to user)
```

## State Management

```
React Component State
│
├── messages: ChatMessage[]
│   └── { id, role, content, timestamp }
│
├── input: string
│   └── Current chat input
│
├── code: string
│   └── Current editor content
│
└── editorState: EditorState
    ├── file_path
    ├── language
    ├── full_code
    ├── cursor_line
    ├── cursor_column
    ├── selected_text
    └── errors[]
```

## API Request/Response

### Request Format
```json
POST /api/v1/tutor/ask

{
  "editor_state": {
    "file_path": "main.js",
    "language": "javascript",
    "full_code": "function test() { ... }",
    "cursor_line": 5,
    "cursor_column": 10,
    "selected_text": "",
    "errors": []
  },
  "user_question": "Why isn't this working?"
}
```

### Response Format
```json
{
  "response": "I see you're working with a function. What do you think happens when you call it without the required parameters?",
  "hints": [],
  "related_concepts": []
}
```

## Error Handling Flow

```
User Action
    ↓
Frontend Validation
    ├── Valid → Continue
    └── Invalid → Show error message
        ↓
API Call
    ├── Success → Process response
    ├── Network Error → Show connection error
    ├── Timeout → Show timeout message
    └── Server Error → Show fallback response
        ↓
Backend Processing
    ├── Success → Return response
    ├── Ollama Error → Return fallback
    └── Validation Error → Return 400
        ↓
Ollama Call
    ├── Success → Parse response
    ├── Connection Error → Use fallback
    └── Timeout → Use fallback
```

## Deployment Architecture

### Development
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │     │   Backend   │     │   Ollama    │
│  (Vite)     │────►│  (FastAPI)  │────►│  (Local)    │
│  :5174      │     │  :8000      │     │  :11434     │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Production (Option 1: Integrated)
```
┌──────────────────────────────────┐
│      AdaptEd Platform            │
│                                  │
│  ┌────────────┐  ┌────────────┐ │
│  │  Frontend  │  │  Backend   │ │
│  │  (Static)  │  │  (FastAPI) │ │
│  └────────────┘  └────────────┘ │
└──────────────────────────────────┘
         │
         ↓
┌──────────────────┐
│  Ollama Server   │
│  (Dedicated)     │
└──────────────────┘
```

### Production (Option 2: Microservice)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   AdaptEd   │     │  MCP-IDE    │     │   Ollama    │
│  Frontend   │────►│  Backend    │────►│   Cluster   │
│             │     │  Service    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Security Layers

```
User Request
    ↓
CORS Validation
    ↓
Input Sanitization
    ↓
Rate Limiting (future)
    ↓
API Processing
    ↓
Code Sanitization
    ↓
LLM Call
    ↓
Response Filtering
    ↓
User Response
```

## Performance Optimization Points

```
Frontend
├── Code Splitting
│   └── Lazy load Monaco Editor
├── Caching
│   └── Cache API responses
└── Debouncing
    └── Debounce context updates

Backend
├── Connection Pooling
│   └── Reuse Ollama connections
├── Response Caching
│   └── Cache common questions
└── Request Queuing
    └── Handle concurrent users

Ollama
├── Model Preloading
│   └── Keep model in memory
└── GPU Acceleration
    └── Use GPU if available
```

This architecture provides a solid foundation for the MCP-IDE system while remaining flexible for future enhancements and integrations.
