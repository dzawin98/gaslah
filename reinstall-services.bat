@echo off
echo Installing dependencies and building frontend...
cd /d C:\gaslah
npm install
npm run build

echo Running database migrations...
cd /d C:\gaslah\backend
npm install
npx sequelize-cli db:migrate

echo Removing existing services...
C:\nssm-2.24\win64\nssm.exe remove latansabackend confirm
timeout /t 30 /nobreak

echo Checking if backend service still exists...
C:\nssm-2.24\win64\nssm.exe status latansabackend >nul 2>&1
if not errorlevel 1 (
    echo Waiting additional time for service removal...
    timeout /t 30 /nobreak
)

C:\nssm-2.24\win64\nssm.exe remove latansafrontend confirm
timeout /t 30 /nobreak

echo Checking if frontend service still exists...
C:\nssm-2.24\win64\nssm.exe status latansafrontend >nul 2>&1
if not errorlevel 1 (
    echo Waiting additional time for service removal...
    timeout /t 30 /nobreak
)

echo Installing backend service...
C:\nssm-2.24\win64\nssm.exe install latansabackend "C:\Program Files\nodejs\node.exe"
C:\nssm-2.24\win64\nssm.exe set latansabackend AppParameters "C:\gaslah\backend\src\index.js"
C:\nssm-2.24\win64\nssm.exe set latansabackend AppDirectory "C:\gaslah\backend"
C:\nssm-2.24\win64\nssm.exe set latansabackend AppEnvironmentExtra "NODE_ENV=production"
C:\nssm-2.24\win64\nssm.exe set latansabackend Start SERVICE_AUTO_START
C:\nssm-2.24\win64\nssm.exe set latansabackend AppRestartDelay 5000
C:\nssm-2.24\win64\nssm.exe set latansabackend AppThrottle 0

echo Installing frontend service...
C:\nssm-2.24\win64\nssm.exe install latansafrontend "C:\Program Files\nodejs\node.exe"
C:\nssm-2.24\win64\nssm.exe set latansafrontend AppParameters "C:\gaslah\node_modules\vite\bin\vite.js preview --port 3000"
C:\nssm-2.24\win64\nssm.exe set latansafrontend AppDirectory "C:\gaslah"
C:\nssm-2.24\win64\nssm.exe set latansafrontend AppEnvironmentExtra "NODE_ENV=production"
C:\nssm-2.24\win64\nssm.exe set latansafrontend Start SERVICE_AUTO_START
C:\nssm-2.24\win64\nssm.exe set latansafrontend AppRestartDelay 5000
C:\nssm-2.24\win64\nssm.exe set latansafrontend AppThrottle 0

echo Starting services...
timeout /t 10 /nobreak
C:\nssm-2.24\win64\nssm.exe start latansabackend
timeout /t 5 /nobreak
C:\nssm-2.24\win64\nssm.exe start latansafrontend

echo Checking service status...
echo Backend service status:
C:\nssm-2.24\win64\nssm.exe status latansabackend
echo Frontend service status:
C:\nssm-2.24\win64\nssm.exe status latansafrontend

echo Done! Please check the service status above.
echo If services are not running, please check Event Viewer for errors.
pause