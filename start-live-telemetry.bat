@echo off
title APEX Live Telemetry Service
wscript.exe "%~dp0start-telemetry.vbs"
echo [OK] Live Telemetry Daemon running in background.
echo Real-time CPU, Core Matrix, and RAM telemetry active.
timeout /t 3
