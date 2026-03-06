# Frontend-Backend Port Configuration Fix

## Problem
Frontend was trying to connect to `http://localhost:8000` but that port is used by MCP-IDE backend, causing connection failures.

## Solution
Changed frontend to use port **8001** for the main AdaptEd backend.

## Changes Made

### 1. Updated `src/lib/api.ts`
```typescript
// Before
const API_BASE_URL = 'http://localhost:8000';

// After
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
```

### 2. Updated `.env`
```bash
# Added
VITE_API_URL=http://localhost:8001
```

### 3. Files Still Need Manual Update
These files have hardcoded `localhost:8000` URLs that need to be changed:

**AdaptEd/frontend/src/pages/Dashboard.tsx** (line 62):
```typescript
// Change from:
const response = await fetch(`http://localhost:8000/users/${currentUser.uid}/stats`);

// To:
const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/users/${currentUser.uid}/stats`);
```

**AdaptEd/frontend/src/pages/Viva.tsx** (lines 58, 117):
```typescript
// Change from:
const response = await fetch(`http://localhost:8000/viva/start-simple?${params}`, {

// To:
const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/viva/start-simple?${params}`, {

// And:
const response = await fetch('http://localhost:8000/viva/complete', {

// To:
const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/viva/complete`, {
```

**AdaptEd/frontend/src/components/viva/VivaRoom.tsx** (line 289):
```typescript
// Change from:
const response = await fetch('http://localhost:8000/viva/chat', {

// To:
const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/viva/chat`, {
```

## Port Allocation

### Current Setup:
- **Port 8000**: MCP-IDE Backend (coding tutor)
- **Port 8001**: AdaptEd Main Backend (roadmap, lessons, viva)
- **Port 5173**: Frontend (Vite dev server)
- **Port 8080**: Sample Frontend

## How to Run

### 1. Start MCP-IDE Backend (Port 8000)
```bash
cd AdaptEd/mcp-ide/backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Start Main Backend (Port 8001)
```bash
cd AdaptEd/backend
python -m uvicorn main:app --reload --port 8001
```

### 3. Start Frontend (Port 5173)
```bash
cd AdaptEd/frontend
npm run dev
```

## Verification

After starting all services:

1. **Check MCP-IDE Backend**: http://localhost:8000/docs
2. **Check Main Backend**: http://localhost:8001/docs
3. **Check Frontend**: http://localhost:5173

## Environment Variables

### Frontend `.env`:
```bash
VITE_API_URL=http://localhost:8001
```

### Backend `.env`:
```bash
GEMINI_API_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

## Next Steps

1. Update the hardcoded URLs in the files listed above
2. Restart frontend after changes
3. Test API connections

## Alternative: Use Port 8000 for Main Backend

If you want to use port 8000 for the main backend instead:

1. Stop MCP-IDE backend
2. Run main backend on port 8000
3. Revert the changes to use `localhost:8000`
4. Run MCP-IDE on a different port (e.g., 8002)

But this is NOT recommended as MCP-IDE is more actively used.
