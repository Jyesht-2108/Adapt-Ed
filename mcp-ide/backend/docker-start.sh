#!/bin/bash

# Docker startup script for MCP-IDE Backend
# This script makes it easy to start the backend with Docker

echo "============================================================"
echo "Starting MCP-IDE Backend with Docker"
echo "============================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed!"
    echo "Please install docker-compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please update it with your configuration."
    else
        echo "❌ .env.example not found!"
        exit 1
    fi
fi

echo "🐳 Building Docker image..."
docker-compose build

echo ""
echo "🚀 Starting MCP-IDE Backend..."
docker-compose up -d

echo ""
echo "✅ MCP-IDE Backend is running!"
echo ""
echo "📍 Backend URL: http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo ""
