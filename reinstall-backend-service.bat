@echo off
echo Uninstalling old service...
C:\nssm-2.24\win64\nssm.exe remove backend-service confirm

echo Waiting for service deletion to complete...
timeout /t 30 /nobreak

echo Checking if service still exists...
sc query backend-service > nul 2>&1
if %errorlevel% equ 0 (
    echo Service still exists, waiting additional time...
    timeout /t 30 /nobreak
)

echo Installing service with correct path...
set "NSSM_PATH=C:\nssm-2.24\win64\nssm.exe"
set "NODE_PATH=C:\Program Files\nodejs\npm.cmd"
set "APP_DIR=C:\gaslah\backend"
set "SERVICE_NAME=backend-service"

"%NSSM_PATH%" install %SERVICE_NAME% "%NODE_PATH%" start
"%NSSM_PATH%" set %SERVICE_NAME% AppDirectory "%APP_DIR%"
"%NSSM_PATH%" set %SERVICE_NAME% AppEnvironmentExtra NODE_ENV=production
"%NSSM_PATH%" set %SERVICE_NAME% Start SERVICE_AUTO_START

echo Waiting for service installation to complete...
timeout /t 10 /nobreak

echo Starting service...
"%NSSM_PATH%" start %SERVICE_NAME%

echo Service status:
"%NSSM_PATH%" status %SERVICE_NAME%

pause