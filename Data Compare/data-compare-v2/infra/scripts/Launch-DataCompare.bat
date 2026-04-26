@echo off
REM ============================================================
REM Data Compare v2 - Smart launcher
REM - If required services are already running, just open the app URL.
REM - If not, build/start the stack and then open the app URL.
REM ============================================================
setlocal EnableExtensions EnableDelayedExpansion

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

set "APP_URL=http://localhost:5000"
for /f "tokens=1,* delims==" %%A in ('findstr /b /c:"NEXT_PUBLIC_API_URL=" .env') do (
  if /i "%%A"=="NEXT_PUBLIC_API_URL" if not "%%B"=="" set "APP_URL=%%B"
)

set "ALL_RUNNING=1"
for %%S in (postgres api web nginx) do (
  set "CID="
  for /f %%I in ('docker compose -f infra\docker\docker-compose.yml --env-file .env ps -q %%S 2^>nul') do set "CID=%%I"
  if not defined CID (
    set "ALL_RUNNING=0"
  ) else (
    set "ISRUN="
    for /f %%R in ('docker inspect -f "{{.State.Running}}" !CID! 2^>nul') do set "ISRUN=%%R"
    if /i not "!ISRUN!"=="true" set "ALL_RUNNING=0"
  )
)

if "%ALL_RUNNING%"=="1" (
  echo All required services are already running.
) else (
  echo One or more services are not running. Starting stack...
  docker compose -f infra\docker\docker-compose.yml --env-file .env up -d --build
  if errorlevel 1 (
    echo Failed to start services. Run this to inspect:
    echo docker compose -f infra\docker\docker-compose.yml --env-file .env logs --tail 120
    exit /b 1
  )
)

echo.
echo Waiting for all services to be ready...
set "RETRY=0"
:WAIT_LOOP
set "ALL_RUNNING=1"
for %%S in (postgres api web nginx) do (
  set "CID="
  for /f %%I in ('docker compose -f infra\docker\docker-compose.yml --env-file .env ps -q %%S 2^>nul') do set "CID=%%I"
  if not defined CID (
    set "ALL_RUNNING=0"
  ) else (
    set "ISRUN="
    for /f %%R in ('docker inspect -f "{{.State.Running}}" !CID! 2^>nul') do set "ISRUN=%%R"
    if /i not "!ISRUN!"=="true" set "ALL_RUNNING=0"
  )
)
if "%ALL_RUNNING%"=="1" goto :READY
set /a RETRY+=1
if %RETRY% geq 24 goto :TIMEOUT
timeout /t 5 /nobreak >nul
goto :WAIT_LOOP

:TIMEOUT
echo.
echo Some services failed to start after 2 minutes. Check logs:
echo docker compose -f infra\docker\docker-compose.yml --env-file .env logs --tail 120
echo.
docker compose -f infra\docker\docker-compose.yml --env-file .env ps
exit /b 1

:READY
echo.
echo Current service status:
docker compose -f infra\docker\docker-compose.yml --env-file .env ps

echo.
echo Opening %APP_URL%
start "" "%APP_URL%"

endlocal
