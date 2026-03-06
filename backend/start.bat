@echo off
echo ============================================================
echo Starting AdaptEd Main Backend on Port 8001
echo ============================================================
echo.

cd /d "%~dp0"

if exist venv\Scripts\activate.bat (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo Warning: Virtual environment not found at venv\Scripts\activate.bat
    echo Continuing without virtual environment...
)

echo.
echo Starting server...
python start.py
