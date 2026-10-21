@echo off
title Protec Live - Serveur & Synthese Vocale Piper TTS
echo ========================================================
echo       PROTEC LIVE - DEMARRAGE DU SERVEUR LOCAL
echo   Synthese Vocale Piper TTS (fr_FR-mls-medium - 125 voix)
echo ========================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe ou pas accessible dans le PATH.
    echo Veuillez installer Node.js depuis https://nodejs.org
    pause
    exit /b 1
)

echo Demarrage du serveur sur http://localhost:8080 ...
echo Appuyez sur Ctrl+C pour arreter le serveur.
echo.

node server.js
pause
