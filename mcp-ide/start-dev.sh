#!/bin/bash

echo "========================================"
echo "MCP-IDE Development Environment"
echo "========================================"
echo ""

# Check if Ollama is running
echo "Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "[ERROR] Ollama is not running!"
    echo "Please start Ollama first."
    echo "Install: curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi
echo "[OK] Ollama is running"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "Done!"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "Starting Backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

sleep 3

echo ""
echo "Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "Development servers running..."
echo "========================================"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5174"
echo "API Docs: http://localhost:8000/docs"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for user interrupt
wait
