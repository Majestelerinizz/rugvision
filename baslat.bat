@echo off
chcp 65001 >nul
title RugVision - dev + tunnel (kesintisiz)
cd /d "%~dp0"

echo ============================================
echo   RugVision kesintisiz calisma modu
echo   Panel : https://rugvision-demo.loca.lt/panel
echo   Lokal : http://localhost:3000/panel
echo   Durdurmak icin bu pencereyi kapat.
echo ============================================
echo.

:loop
echo [%date% %time%] Baslatiliyor (dev + tunnel)...
call npm run dev:all
echo.
echo [%date% %time%] Surec durdu. 3 saniye sonra YENIDEN baslatiliyor...
timeout /t 3 /nobreak >nul
goto loop
