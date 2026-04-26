@echo off
setlocal
cd /d "%~dp0..\.."
docker compose -f infra\docker\docker-compose.yml down
endlocal
