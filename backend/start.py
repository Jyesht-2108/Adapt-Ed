"""
Startup script for AdaptEd main backend
Runs on port 8001 (NOT 8000 which is for mcp-ide)
"""
import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("Starting AdaptEd Main Backend")
    print("Port: 8001")
    print("Frontend should connect to: http://localhost:8001")
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
