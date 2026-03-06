# Docker Setup for MCP-IDE Backend

This guide explains how to run the MCP-IDE backend using Docker, which eliminates Python dependency issues across different operating systems.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose

### Install Docker

**Windows/Mac:**
- Download and install [Docker Desktop](https://docs.docker.com/desktop/)

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install docker-compose
sudo apt-get install docker-compose-plugin
```

## Quick Start

### Option 1: Using Startup Scripts (Recommended)

**Windows:**
```bash
cd mcp-ide/backend
docker-start.bat
```

**Linux/Mac:**
```bash
cd mcp-ide/backend
chmod +x docker-start.sh
./docker-start.sh
```

### Option 2: Manual Docker Commands

```bash
cd mcp-ide/backend

# Build the image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

## Configuration

1. Make sure your `.env` file exists in `mcp-ide/backend/`
2. The backend will run on `http://localhost:8000`
3. Database files are persisted in `mcp-ide/backend/database/`

## Useful Commands

```bash
# View running containers
docker ps

# View logs
docker-compose logs -f mcp-ide-backend

# Restart the backend
docker-compose restart

# Stop and remove containers
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Access container shell
docker-compose exec mcp-ide-backend bash

# View resource usage
docker stats mcp-ide-backend
```

## Development Mode

The docker-compose.yml is configured for development with:
- Hot reload: Code changes are reflected immediately (volume mounted)
- Port mapping: `8000:8000`
- Environment variables from `.env`
- Persistent database storage

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8000
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000

# Stop the conflicting process or change the port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
docker-compose logs mcp-ide-backend

# Remove and rebuild
docker-compose down
docker-compose up -d --build
```

### Permission Issues (Linux)
```bash
# Fix database folder permissions
sudo chown -R $USER:$USER database/
```

### Clean Restart
```bash
# Remove everything and start fresh
docker-compose down -v
docker-compose up -d --build
```

## Production Deployment

For production, modify `docker-compose.yml`:

```yaml
services:
  mcp-ide-backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: mcp-ide-backend
    ports:
      - "8000:8000"
    volumes:
      # Remove code mount for production
      - ./database:/app/database
    env_file:
      - .env
    restart: always  # Changed from unless-stopped
    networks:
      - mcp-ide-network
```

## Benefits of Docker

✅ **No Python version conflicts** - Uses Python 3.12 in container  
✅ **Consistent environment** - Works the same on Windows, Mac, Linux  
✅ **Easy dependency management** - All dependencies in container  
✅ **Isolated** - Doesn't affect system Python  
✅ **Easy cleanup** - Just remove the container  
✅ **Portable** - Share the same setup with team

## Frontend Connection

The frontend should connect to `http://localhost:8000` as usual. No changes needed to the frontend configuration.

## Notes

- The container runs as a non-root user for security
- Database files are persisted outside the container
- Environment variables are loaded from `.env`
- Hot reload is enabled for development
