# Port Configuration

This project has two separate applications with different backends:

## Port Assignments

### Main AdaptEd Application
- **Frontend**: `http://localhost:8080` (Vite dev server)
- **Backend**: `http://localhost:8001` (FastAPI - main.py in /backend)
- **Purpose**: Main learning platform with roadmap generation, lessons, viva

### MCP-IDE Application  
- **Frontend**: `http://localhost:5174` (Vite dev server)
- **Backend**: `http://localhost:8000` (FastAPI - main.py in /mcp-ide/backend)
- **Purpose**: Code editor with AI tutor for programming practice

## Environment Configuration

### Main Frontend (`/frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8001
```

### MCP-IDE Frontend (`/mcp-ide/frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Running the Applications

### Main AdaptEd
```bash
# Terminal 1 - Backend (Port 8001)
cd backend
python start.py
# OR on Windows:
# start.bat

# Terminal 2 - Frontend (Port 8080)
cd frontend
npm run dev
```

### MCP-IDE
```bash
# Terminal 1 - Backend (Port 8000)
cd mcp-ide/backend
python main.py

# Terminal 2 - Frontend (Port 5174)
cd mcp-ide/frontend
npm run dev
```

## Important Notes

- The two applications are **completely separate** and should not cross-communicate
- Make sure to start the correct backend for each frontend
- If you see 404 errors, check that you're connecting to the right backend port
- The main backend (8001) handles user profiles, roadmaps, lessons, and viva
- The MCP-IDE backend (8000) handles code execution, file management, and AI tutoring
