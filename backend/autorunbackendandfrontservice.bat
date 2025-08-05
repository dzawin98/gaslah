@echo off
set "NSSM_PATH=C:\nssm-2.24\win64\nssm.exe"

echo === Setting recovery & auto-start for backend-service ===
"%NSSM_PATH%" set backend-service Start SERVICE_AUTO_START
"%NSSM_PATH%" set backend-service AppRestartDelay 5000
"%NSSM_PATH%" set backend-service AppThrottle 0
"%NSSM_PATH%" set backend-service AppExit Default Restart

echo === Setting recovery & auto-start for preview-service ===
"%NSSM_PATH%" set preview-service Start SERVICE_AUTO_START
"%NSSM_PATH%" set preview-service AppRestartDelay 5000
"%NSSM_PATH%" set preview-service AppThrottle 0
"%NSSM_PATH%" set preview-service AppExit Default Restart

echo.
echo Semua konfigurasi selesai. Kedua service akan auto-start dan auto-restart jika crash.
pause
