@echo off
echo Listing all NSSM services...

for /f "tokens=1" %%s in ('C:\nssm-2.24\win64\nssm.exe list') do (
    echo Removing service: %%s
    C:\nssm-2.24\win64\nssm.exe remove "%%s" confirm
    timeout /t 10 /nobreak
)

echo All NSSM services have been removed.
echo Please restart your computer to ensure all services are completely removed.
pause