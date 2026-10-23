@echo off
setlocal
cd /d "%~dp0"
echo Detecting this PC's hardware...
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0detect-hardware.ps1"
echo.
if errorlevel 1 (
  echo Hardware detection failed. Read the error above.
) else (
  echo.
  echo Done. hardware.js was written in this folder.
)
pause
