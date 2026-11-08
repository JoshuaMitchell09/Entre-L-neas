@echo off
chcp 65001 >nul
title ENTRE LINEAS - Fotografo de la Liga Tica
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas instalar Node.js 18 o superior: https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)
if not exist dist\index.html (
  echo Compilando el juego...
  call npm run build
)
echo Abriendo ENTRE LINEAS en el navegador...
start "" http://localhost:4173
call npm run preview
