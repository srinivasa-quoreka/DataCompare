@echo off
chcp 437 >nul
title FT Validator -- Install Windows Service

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Please right-click and "Run as administrator"
    echo.
    pause & exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)

set SERVICE_NAME=FTValidator
set SERVICE_DISPLAY=FT Validator Web Server
set INSTALL_DIR=%~dp0
set SERVER_JS=%INSTALL_DIR%server.js
set LOG_DIR=%INSTALL_DIR%logs

for /f "tokens=*" %%i in ('where node') do set NODE_EXE=%%i

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo.
echo  ====================================================
echo   Installing FT Validator as Windows Service
echo  ====================================================
echo.
echo  Removing old service if it exists...
sc stop %SERVICE_NAME% >nul 2>&1
sc delete %SERVICE_NAME% >nul 2>&1
timeout /t 2 >nul

where nssm >nul 2>&1
if %errorlevel% equ 0 (
    echo  Installing with NSSM...
    nssm install %SERVICE_NAME% "%NODE_EXE%" "%SERVER_JS%"
    nssm set %SERVICE_NAME% DisplayName "%SERVICE_DISPLAY%"
    nssm set %SERVICE_NAME% AppDirectory "%INSTALL_DIR%"
    nssm set %SERVICE_NAME% AppEnvironmentExtra "PORT=5000"
    nssm set %SERVICE_NAME% AppStdout "%LOG_DIR%\output.log"
    nssm set %SERVICE_NAME% AppStderr "%LOG_DIR%\error.log"
    nssm set %SERVICE_NAME% AppRotateFiles 1
    nssm set %SERVICE_NAME% Start SERVICE_AUTO_START
    nssm start %SERVICE_NAME%
    goto :done
)

echo  NSSM not found -- using sc.exe fallback...
echo  (For better logging, download nssm.exe from nssm.cc and place in System32)
sc create %SERVICE_NAME% binpath= "\"%NODE_EXE%\" \"%SERVER_JS%\"" DisplayName= "%SERVICE_DISPLAY%" start= auto obj= LocalSystem
sc description %SERVICE_NAME% "Serves FT Validator on port 5000"
sc start %SERVICE_NAME%

:done
echo.
echo  ====================================================
echo   Service Installed!
echo  ====================================================
echo.
echo  The server now starts automatically on Windows boot.
echo.
echo  Team URL:  http://YOUR-IP:5000
echo  Local URL: http://localhost:5000
echo.
echo  To manage: open services.msc
echo             look for "FT Validator Web Server"
echo.
timeout /t 3 >nul
echo  Verifying port 5000...
netstat -ano | findstr :5000
echo.
pause
