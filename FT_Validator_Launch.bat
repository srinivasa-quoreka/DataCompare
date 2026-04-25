@echo off
chcp 437 >nul
title FT Validator -- Launcher
color 0A
set PORT=5000

echo.
echo  ============================================================
echo   FT Validator -- Starting Up
echo  ============================================================

REM -- Check Node.js ------------------------------------------------
echo.
echo  [1/3] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ERROR: Node.js not installed.
    echo  Download from: https://nodejs.org  ^(LTS version^)
    echo.
    pause & exit /b 1
)
echo  OK  Node.js is installed.

REM -- Check files --------------------------------------------------
echo.
echo  [2/3] Checking required files...
if not exist "%~dp0server.js" (
    color 0C
    echo.
    echo  ERROR: server.js not found.
    echo  All files must be in the same folder as this bat file.
    echo.
    pause & exit /b 1
)
if not exist "%~dp0index.html" (
    color 0C
    echo.
    echo  ERROR: index.html not found.
    echo  All files must be in the same folder as this bat file.
    echo.
    pause & exit /b 1
)
echo  OK  server.js found.
echo  OK  index.html found.

REM -- Kill anything already on port 5000 --------------------------
echo.
echo  [3/3] Checking port %PORT%...
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo  WARN: Port %PORT% already in use. Clearing...
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
        taskkill /PID %%p /F >nul 2>&1
    )
    timeout /t 2 >nul
    echo  OK  Port cleared.
) else (
    echo  OK  Port %PORT% is free.
)

REM -- Open browser -------------------------------------------------
start "" "http://localhost:%PORT%"

REM -- Start server -------------------------------------------------
echo.
echo  ============================================================
echo   Server starting on port %PORT%...
echo  ============================================================
echo.
echo  Local URL : http://localhost:%PORT%
echo.
echo  Your Network URL will appear below once server starts.
echo  Share that URL with your team.
echo.
echo  If team cannot connect, run DIAGNOSE_AND_FIX.bat as Admin.
echo  Press Ctrl+C to stop the server.
echo  ============================================================
echo.

cd /d "%~dp0"
node server.js

echo.
echo  Server stopped.
pause
