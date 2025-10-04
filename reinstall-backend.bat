@echo off
echo Uninstalling existing service...
C:\nssm-2.24\win32\nssm.exe remove backend-service confirm

timeout /t 10 /nobreak

echo Installing service...
C:\nssm-2.24\win32\nssm.exe install backend-service "C:\Program Files\nodejs\node.exe" "C:\gaslah\backend\src\index.ts"
C:\nssm-2.24\win32\nssm.exe set backend-service AppDirectory "C:\gaslah\backend"
C:\nssm-2.24\win32\nssm.exe set backend-service AppEnvironmentExtra NODE_ENV=production
C:\nssm-2.24\win32\nssm.exe set backend-service Start SERVICE_AUTO_START

timeout /t 5 /nobreak

echo Starting service...
C:\nssm-2.24\win32\nssm.exe start backend-service

timeout /t 5 /nobreak

echo Checking service status...
C:\nssm-2.24\win32\nssm.exe status backend-service

pause