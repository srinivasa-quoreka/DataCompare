@echo off
REM Run database migrations and seed default users.
REM Run AFTER Start-DataCompare.bat once the API container is up.
setlocal
cd /d "%~dp0..\.."
docker compose -f infra\docker\docker-compose.yml exec api sh -lc "cd /app && npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node -e \"require('child_process').spawnSync('npx',['ts-node','apps/api/prisma/seed.ts'],{stdio:'inherit'})\""
echo Done. Default users seeded. ROTATE PASSWORDS via the admin UI immediately.
endlocal
