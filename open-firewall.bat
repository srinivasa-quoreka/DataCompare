@echo off
chcp 437 >nul
title FT Validator -- Open Firewall Port 5000

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Run as Administrator required.
    pause & exit /b 1
)

echo.
echo  Removing old rules and adding port 5000 firewall rule...
echo.

netsh advfirewall firewall delete rule name="FT Validator" >nul 2>&1
netsh advfirewall firewall delete rule name="FT Validator Port 5000" >nul 2>&1
netsh advfirewall firewall delete rule name="FTValidator" >nul 2>&1

netsh advfirewall firewall add rule ^
    name="FT Validator Port 5000" ^
    dir=in ^
    action=allow ^
    protocol=TCP ^
    localport=5000 ^
    profile=any ^
    enable=yes

echo.
echo  ====================================================
echo   Firewall rule added for port 5000
echo  ====================================================
echo.
echo  Run ipconfig to find your IP address.
echo  Share this URL with your team:
echo    http://YOUR-IP:5000
echo.
echo  If team still cannot connect, run DIAGNOSE_AND_FIX.bat
echo.
pause
