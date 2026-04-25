@echo off
chcp 437 >nul
title FT Validator -- Network Diagnostics and Fix
color 0A

echo.
echo  ============================================================
echo   FT Validator -- Network Access Diagnostics
echo  ============================================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  ERROR: This script needs Administrator rights.
    echo.
    echo  Right-click this file and choose "Run as administrator"
    echo.
    pause & exit /b 1
)
echo  [OK] Running as Administrator

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODEVER=%%v
echo  [OK] Node.js %NODEVER%

echo.
echo  -- Checking if server is running on port 5000...
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARN] Server is NOT running on port 5000.
    echo         Start it first with FT_Validator_Launch.bat
) else (
    echo  [OK] Server IS listening on port 5000.
)

echo.
echo  -- Detecting network IP address...
set MY_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| findstr /v "169.254"') do (
    set RAW=%%a
    goto :gotip
)
:gotip
for /f "tokens=1" %%b in ("%RAW%") do set MY_IP=%%b

if "%MY_IP%"=="" (
    echo  [WARN] Could not auto-detect IP. Run ipconfig manually.
) else (
    echo  [OK] Network IP: %MY_IP%
    echo       Team URL:   http://%MY_IP%:5000
)

echo.
echo  -- All IPv4 addresses on this machine:
ipconfig | findstr /i "IPv4"

echo.
echo  -- Removing old firewall rules for port 5000...
netsh advfirewall firewall delete rule name="FT Validator" >nul 2>&1
netsh advfirewall firewall delete rule name="FT Validator Port 5000" >nul 2>&1
netsh advfirewall firewall delete rule name="FTValidator" >nul 2>&1
netsh advfirewall firewall delete rule name="NodeJS FT Validator" >nul 2>&1
echo  [OK] Old rules cleared.

echo.
echo  -- Adding fresh inbound TCP rule for port 5000 (all profiles)...
netsh advfirewall firewall add rule ^
    name="FT Validator Port 5000" ^
    dir=in ^
    action=allow ^
    protocol=TCP ^
    localport=5000 ^
    profile=any ^
    enable=yes
if %errorlevel% equ 0 (
    echo  [OK] Inbound TCP rule added.
) else (
    echo  [ERROR] Failed to add firewall rule.
)

echo.
echo  -- Allowing node.exe through firewall...
for /f "tokens=*" %%n in ('where node 2^>nul') do set NODE_EXE=%%n
if not "%NODE_EXE%"=="" (
    netsh advfirewall firewall add rule ^
        name="NodeJS FT Validator" ^
        dir=in ^
        action=allow ^
        program="%NODE_EXE%" ^
        enable=yes ^
        profile=any >nul 2>&1
    echo  [OK] node.exe allowed: %NODE_EXE%
)

echo.
echo  -- Current network profile and firewall state:
netsh advfirewall show currentprofile state

echo.
echo  -- Testing localhost:5000...
powershell -Command "try { $t = New-Object System.Net.Sockets.TcpClient('127.0.0.1',5000); $t.Close(); Write-Host '  [OK] localhost:5000 is reachable' } catch { Write-Host '  [WARN] localhost:5000 not reachable - is the server running?' }" 2>nul

if not "%MY_IP%"=="" (
    echo.
    echo  -- Testing %MY_IP%:5000...
    powershell -Command "try { $t = New-Object System.Net.Sockets.TcpClient('%MY_IP%',5000); $t.Close(); Write-Host '  [OK] %MY_IP%:5000 is reachable from this machine' } catch { Write-Host '  [WARN] %MY_IP%:5000 not reachable yet' }" 2>nul
)

echo.
echo  ============================================================
echo   SUMMARY - If team still cannot connect, check these:
echo  ============================================================
echo.
echo  1. FIREWALL -- this script already fixed it.
echo     If still blocked, ask IT to allow port 5000.
echo.
echo  2. NETWORK PROFILE set to "Public" blocks connections.
echo     Go to: Settings - Network - change to Private.
echo.
echo  3. SERVER NOT RUNNING
echo     Run FT_Validator_Launch.bat first.
echo.
echo  4. WRONG IP ADDRESS
if not "%MY_IP%"=="" (
    echo     Share exactly: http://%MY_IP%:5000
) else (
    echo     Run ipconfig, find IPv4, use: http://YOUR-IP:5000
)
echo.
echo  5. CORPORATE FIREWALL / GROUP POLICY
echo     Ask IT to open port 5000 inbound on this machine.
echo.
echo  6. DIFFERENT NETWORK SEGMENT / VPN
echo     Both machines must be on the same LAN.
echo.
echo  ============================================================
echo.
pause
