@echo off
echo ======================================================
echo   Cloud Integrated Secure IoT Gateway Simulator
echo ======================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b
)

:: Check for NPM
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] NPM is not installed or not in PATH.
    pause
    exit /b
)

echo [1/3] Initializing Database...
cd backend
node scripts/init_db.js
if %errorlevel% neq 0 (
    echo [WARNING] Database initialization failed. Ensure PostgreSQL is running.
)

echo.
echo [2/3] Starting Backend Server...
start "IoT Simulator Backend" cmd /c "npm.cmd run dev"

echo.
echo [3/3] Starting Frontend Dashboard...
cd ../frontend
start "IoT Simulator Frontend" cmd /c "npm.cmd run dev"

echo.
echo ======================================================
echo   SUCCESS: Servers are starting in separate windows.
echo   Access the dashboard at: http://localhost:5173
echo ======================================================
echo.
pause
