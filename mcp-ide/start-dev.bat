@echo off
echo ========================================
echo MCP-IDE Development Environment
echo ========================================
echo.

echo Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ollama is not running!
    echo Please start Ollama first.
    echo Download from: https://ollama.ai/download
    pause
    exit /b 1
)
echo [OK] Ollama is running

echo.
echo Starting Backend...
start "MCP-IDE Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend...
start "MCP-IDE Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Development servers starting...
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5174
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Press any key to stop all servers...
pause >nul

echo.
echo Stopping servers...
taskkill /FI "WindowTitle eq MCP-IDE Backend*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq MCP-IDE Frontend*" /T /F >nul 2>&1
echo Done!
