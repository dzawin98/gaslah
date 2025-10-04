@echo off
echo Removing all NSSM services...

C:\nssm-2.24\win32\nssm.exe remove backend-service confirm
timeout /t 10 /nobreak

C:\nssm-2.24\win32\nssm.exe remove latansabackend confirm
timeout /t 10 /nobreak

C:\nssm-2.24\win32\nssm.exe remove latansafrontend confirm
timeout /t 10 /nobreak

echo All services have been removed.
echo Now you can install the services again.

pause