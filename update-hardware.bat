@echo off
chcp 65001 >nul
echo ========================================================
echo   APEX HARDWARE MONITOR - SYSTEM PROFILER
echo ========================================================
echo.
echo Scanning CPU, GPU, VRAM, RAM, Mainboard, and Network...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0detect-hardware.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] PowerShell execution failed.
    echo Please verify execution policy or run as Administrator.
    echo.
    pause
    exit /b 1
)
echo.
echo ========================================================
echo Setup complete. hardware.js has been updated.
echo.
echo Reload Wallpaper Engine or toggle the wallpaper to apply.
echo ========================================================
echo.
echo For real-time Task Manager telemetry: run start-live-telemetry.bat
echo.
pause
