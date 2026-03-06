# Multi-File IDE Implementation Guide

## 🎯 Goal
Build a VS Code-like multi-file editor with:
- File explorer sidebar
- Create/edit/delete files
- File persistence in database
- RAG for multi-file context awareness
- File history/versions

## ✅ Completed (Step 1-2)

### 1. Database Schema (`multifile_schema.sql`)
- ✅ `projects` table - Project management
- ✅ `files` table - Individual files
- ✅ `file_versions` table - Version history
- ✅ Enhanced `code_embeddings` - RAG support
- ✅ Helper functions for queries
- ✅ Auto-versioning triggers

### 2. Backend Service (`file_service.py`)
- ✅ Project CRUD operations
- ✅ File CRUD operations
- ✅ Active file tracking
- ✅ File history retrieval

## 🚧 Next Steps

### Step 3: Backend API Endpoints
Create `/api/v1/files` endpoints:
- `POST /projects` - Create project
- `GET /projects` - List projects
- `GET /projects/{id}` - Get project
- `GET /projects/{id}/files` - Get all files
- `POST /files` - Create file
- `GET /files/{id}` - Get file
- `PATCH /files/{id}` - Update file
- `DELETE /files/{id}` - Delete file
- `POST /files/{id}/activate` - Set as active

### Step 4: Frontend File Explorer
- Sidebar with file tree
- Create/rename/delete file buttons
- File tabs for open files
- Active file highlighting

### Step 5: RAG Integration
- Embedding generation service
- Auto-generate embeddings on file save
- Search similar code across files
- Enhanced AI context with relevant files

### Step 6: Enhanced AI Tutor
- Multi-file awareness
- Reference other files in responses
- Suggest related code from project

## 📊 Architecture

```
Frontend (React)
├── FileExplorer (Sidebar)
│   ├── ProjectSelector
│   ├── FileTree
│   └── FileActions (New, Delete, Rename)
├── EditorTabs
│   └── Multiple open files
└── MonacoEditor
    └── Current file content

Backend (FastAPI)
├── /api/v1/files
│   ├── Projects CRUD
│   ├── Files CRUD
│   └── File versions
├── /api/v1/embeddings
│   ├── Generate embeddings
│   └── Search similar code
└── /api/v1/tutor
    └── Enhanced with multi-file context

Database (Supabase)
├── projects
├── files
├── file_versions
└── code_embeddings (enhanced)
```

## 🎨 UI Design

```
┌─────────────────────────────────────────────────────┐
│  MCP-IDE                                    [User]  │
├──────────┬──────────────────────────────────────────┤
│          │  main.js  utils.js  [+]                  │
│ 📁 Files │──────────────────────────────────────────│
│          │                                           │
│ My Proj  │  1  function fibonacci(n) {              │
│ ├─ 📄 ma │  2    if (n <= 1) return n;              │
│ ├─ 📄 ut │  3    return fib(n-1) + fib(n-2);        │
│ └─ 📄 te │  4  }                                     │
│          │                                           │
│ [+ New]  │                                           │
│          │                                           │
│ 🤖 Tutor │                                           │
│          │                                           │
│ Gemini   │                                           │
│          │                                           │
└──────────┴──────────────────────────────────────────┘
```

## 🔄 Workflow

### Creating a File
1. User clicks "+ New File"
2. Modal asks for filename
3. Frontend calls `POST /api/v1/files`
4. Backend creates file in DB
5. Frontend adds to file tree
6. Opens in editor

### Switching Files
1. User clicks file in tree
2. Frontend calls `GET /api/v1/files/{id}`
3. Backend returns file content
4. Frontend loads in Monaco
5. Backend marks as active file

### Saving Files
1. User edits code (auto-save every 2s)
2. Frontend calls `PATCH /api/v1/files/{id}`
3. Backend updates content
4. Trigger creates version in `file_versions`
5. Background job generates embeddings

### AI with Multi-File Context
1. User asks question
2. Backend searches embeddings for relevant code
3. Finds similar patterns in other files
4. Includes in AI context
5. AI references other files in response

## 📝 Example AI Response with RAG

**Without RAG:**
> "You can use a helper function for that."

**With RAG:**
> "You can use a helper function for that. I see you already have an `add()` function in `utils.js` that follows a similar pattern. You could create a similar function here."

## 🚀 Ready to Continue?

I've set up:
- ✅ Database schema
- ✅ Backend service layer

Next, I'll create:
- API endpoints
- Frontend file explorer
- RAG integration

Let me know when you're ready for Step 3!
