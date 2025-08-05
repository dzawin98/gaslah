@echo off
:: ======= KONFIGURASI ========
set "NSSM_PATH=C:\nssm-2.24\nssm.exe"
set "NODE_PATH=C:\Program Files\nodejs\npm.cmd"
set "APP_DIR=C:\gaslah\backend"
set "SERVICE_NAME=backend-service"

:: ======= INSTALL SERVICE ========
"%NSSM_PATH%" install %SERVICE_NAME% "%NODE_PATH%" start
"%NSSM_PATH%" set %SERVICE_NAME% AppDirectory "%APP_DIR%"
"%NSSM_PATH%" set %SERVICE_NAME% AppEnvironmentExtra NODE_ENV=production
"%NSSM_PATH%" set %SERVICE_NAME% Start SERVICE_AUTO_START

echo.
echo Service "%SERVICE_NAME%" berhasil dibuat.
pause
