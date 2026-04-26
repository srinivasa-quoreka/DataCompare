@echo off
REM ============================================================
REM Data Compare v2 - Windows launcher
REM Requires Docker Desktop (or Docker Engine) installed.
REM ============================================================
setlocal
cd /d "%~dp0..\.."
if not exist .env (
  echo .env not found. Copying from .env.example - EDIT THIS BEFORE PRODUCTION USE.
  copy .env.example .env >nul
)
docker compose -f infra\docker\docker-compose.yml --env-file .env up -d
if errorlevel 1 (
  echo Failed to start. Check Docker Desktop is running.
  exit /b 1
)
echo.
echo Data Compare is starting...
echo   Web:    http://%COMPUTERNAME%:5000
echo   API:    http://%COMPUTERNAME%:3001/api
echo   DB:     localhost:5432
echo.
echo First-time setup: run scripts\First-Time-Setup.bat to migrate the DB and seed users.
endlocal
