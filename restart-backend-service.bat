@echo off
echo Restarting backend service...
C:\nssm-2.24\win64\nssm.exe restart backend-service
echo Service status:
C:\nssm-2.24\win64\nssm.exe status backend-service
pause