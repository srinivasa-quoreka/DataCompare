@echo off
REM ============================================================
REM Data Compare v2 - Build only (Docker images)
REM ============================================================
setlocal EnableExtensions

cd /d "%~dp0\..\.."

if not exist .env (
  echo .env not found. Copying from .env.example - EDIT THIS BEFORE PRODUCTION USE.
  copy .env.example .env >nul
)

where docker >nul 2>&1
if errorlevel 1 (
  echo Docker CLI was not found. Install Docker Desktop and try again.
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker engine is not reachable. Start Docker Desktop and try again.
  exit /b 1
)

echo Building Data Compare images (api + web)...
docker compose -f infra\docker\docker-compose.yml --env-file .env build
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

echo Build completed successfully.
endlocal
