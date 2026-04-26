@echo off
REM ============================================================
REM Data Compare v2 - Launch wrapper
REM Calls the smart launcher script.
REM ============================================================
setlocal
cd /d "%~dp0"
call Launch-DataCompare.bat
exit /b %ERRORLEVEL%
