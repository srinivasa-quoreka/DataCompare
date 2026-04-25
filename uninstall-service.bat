@echo off
chcp 437 >nul
title FT Validator -- Uninstall Service

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Run as Administrator required.
    pause & exit /b 1
)

set SERVICE_NAME=FTValidator

echo.
echo  Stopping and removing FT Validator service...
echo.

where nssm >nul 2>&1
if %errorlevel% equ 0 (
    nssm stop %SERVICE_NAME% >nul 2>&1
    nssm remove %SERVICE_NAME% confirm
) else (
    sc stop %SERVICE_NAME% >nul 2>&1
    sc delete %SERVICE_NAME%
)

echo.
echo  Done. Service removed successfully.
echo.
pause
