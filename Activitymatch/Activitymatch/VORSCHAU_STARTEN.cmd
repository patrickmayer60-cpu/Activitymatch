@echo off
cd /d "%~dp0"
title ActivityMatch - Lokale Vorschau
if not exist "node_modules\vite\bin\vite.js" (
  echo Bitte zuerst im Projektordner npm.cmd ci ausfuehren.
  pause
  exit /b 1
)
echo ActivityMatch startet lokal. Dieses Fenster geoeffnet lassen.
echo Beenden mit Strg+C. Keine Datenbank und kein E-Mail-Versand.
node node_modules\vite\bin\vite.js --config vite.preview.config.ts
pause
