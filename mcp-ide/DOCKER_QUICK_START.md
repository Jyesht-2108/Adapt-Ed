# Docker Quick Start - MCP-IDE Backend

Perfect for your Linux friend who has Python dependency issues!

## Why Docker?

✅ No Python version conflicts  
✅ No pip dependency hell  
✅ Works identically on Windows, Mac, and Linux  
✅ One command to start everything  
✅ Easy to clean up and restart  

## Prerequisites

Just install Docker:

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

**Windows/Mac:**
Download [Docker Desktop](https://docs.docker.com/desktop/)

## Start Backend with Docker

### Step 1: Navigate to backend folder
```bash
cd mcp-ide/backend
```

### Step 2: Make sure .env exists
```bash
# If .env doesn't exist, copy from example
cp .env.example .env
# Edit .env and add your API keys
```

### Step 3: Run the startup script

**Linux/Mac:**
```bash
chmod +x docker-start.sh
./docker-start.sh
```

**Windows:**
```bash
docker-start.bat
```

**Or manually:**
```bash
docker-compose up -d --build
```

### Step 4: Verify it's running
```bash
# Check if container is running
docker ps

# View logs
docker-compose logs -f

# Test the API
curl http://localhost:8000/health
```

## Start Frontend (Normal Way)

The frontend doesn't need Docker - just run it normally:

```bash
cd mcp-ide/frontend
npm install
npm run dev
```

Frontend will connect to `http://localhost:8000` automatically.

## Common Commands

```bash
# View logs
docker-compose logs -f

# Restart backend
docker-compose restart

# Stop backend
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Clean restart
docker-compose down -v
docker-compose up -d --build
```

## Troubleshooting

### Port 8000 already in use
```bash
# Linux/Mac
lsof -i :8000

# Windows
netstat -ano | findstr :8000

# Then kill the process or change port in docker-compose.yml
```

### Container won't start
```bash
# Check logs
docker-compose logs

# Try rebuilding
docker-compose down
docker-compose up -d --build
```

### Permission denied (Linux)
```bash
# Add yourself to docker group
sudo usermod -aG docker $USER
newgrp docker

# Fix database folder permissions
sudo chown -R $USER:$USER database/
```

## What Gets Dockerized?

✅ **Backend (Python)** - Runs in Docker container  
❌ **Frontend (Node.js)** - Runs normally on your machine  

This is the best approach because:
- Backend has complex Python dependencies → Docker solves this
- Frontend is simple (just npm) → No need for Docker overhead

## For Your Linux Friend

Tell them to:

1. Install Docker (one command)
2. Clone the repo
3. Run `./docker-start.sh` in `mcp-ide/backend`
4. Run `npm run dev` in `mcp-ide/frontend`

No Python, no pip, no dependency issues!

## Full Setup Example

```bash
# 1. Install Docker (Linux)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Clone and setup
git clone <repo>
cd mcp-ide/backend

# 3. Configure
cp .env.example .env
# Edit .env with your API keys

# 4. Start backend with Docker
chmod +x docker-start.sh
./docker-start.sh

# 5. Start frontend (in new terminal)
cd ../frontend
npm install
npm run dev

# 6. Open browser
# http://localhost:5174
```

Done! No Python installation needed.
