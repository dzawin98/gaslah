@echo off
echo Installing backend service...

cd C:\gaslah\backend
npm install

timeout /t 5 /nobreak

echo Installing service...
C:\nssm-2.24\win32\nssm.exe install latansabackend "C:\Program Files\nodejs\node.exe" "C:\gaslah\backend\dist\index.js"
C:\nssm-2.24\win32\nssm.exe set latansabackend AppDirectory "C:\gaslah\backend"
C:\nssm-2.24\win32\nssm.exe set latansabackend AppEnvironmentExtra NODE_ENV=production
C:\nssm-2.24\win32\nssm.exe set latansabackend Start SERVICE_AUTO_START

timeout /t 5 /nobreak

echo Starting service...
C:\nssm-2.24\win32\nssm.exe start latansabackend

timeout /t 5 /nobreak

echo Checking service status...
C:\nssm-2.24\win32\nssm.exe status latansabackend

pause