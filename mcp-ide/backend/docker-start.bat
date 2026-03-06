@echo off
REM Docker startup script for MCP-IDE Backend (Windows)

echo ============================================================
echo Starting MCP-IDE Backend with Docker
echo ============================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed!
    echo Please install Docker Desktop from: https://docs.docker.com/desktop/install/windows-install/
    exit /b 1
)

REM Check if docker-compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose is not installed!
    echo Please install docker-compose or use Docker Desktop which includes it.
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found!
    if exist .env.example (
        echo Creating .env from .env.example...
        copy .env.example .env
        echo ✅ Created .env file. Please update it with your configuration.
    ) else (
        echo ❌ .env.example not found!
        exit /b 1
    )
)

echo 🐳 Building Docker image...
docker-compose build

echo.
echo 🚀 Starting MCP-IDE Backend...
docker-compose up -d

echo.
echo ✅ MCP-IDE Backend is running!
echo.
echo 📍 Backend URL: http://localhost:8000
echo 📍 API Docs: http://localhost:8000/docs
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
