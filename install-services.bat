@echo off
echo Installing services...

REM Install backend service
C:\nssm-2.24\win64\nssm.exe install latansabackend "C:\Program Files\nodejs\node.exe" "C:\gaslah\backend\src\index.js"
C:\nssm-2.24\win64\nssm.exe set latansabackend AppDirectory C:\gaslah\backend
C:\nssm-2.24\win64\nssm.exe set latansabackend AppEnvironmentExtra NODE_ENV=production
C:\nssm-2.24\win64\nssm.exe set latansabackend Start SERVICE_AUTO_START

REM Install frontend service
C:\nssm-2.24\win64\nssm.exe install latansafrontend "C:\Program Files\nodejs\node.exe" "C:\gaslah\node_modules\vite\bin\vite.js" preview --port 3000
C:\nssm-2.24\win64\nssm.exe set latansafrontend AppDirectory C:\gaslah
C:\nssm-2.24\win64\nssm.exe set latansafrontend Start SERVICE_AUTO_START

REM Start services
C:\nssm-2.24\win64\nssm.exe start latansabackend
timeout /t 5
C:\nssm-2.24\win64\nssm.exe start latansafrontend

REM Check service status
echo.
echo Service status:
C:\nssm-2.24\win64\nssm.exe status latansabackend
C:\nssm-2.24\win64\nssm.exe status latansafrontend

echo.
echo Installation complete. Please check the status above.
pause