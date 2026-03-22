@echo off
setlocal EnableExtensions

echo ==============================================
echo  Library DB Project - Shutdown
echo ==============================================
echo.

echo [1/3] Closing app terminal windows...
taskkill /FI "WINDOWTITLE eq Library Backend" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Library Frontend" /T /F >nul 2>&1

echo [2/3] Stopping Node processes on known ports...
for %%P in (5000 5173) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    taskkill /PID %%I /F >nul 2>&1
  )
)

echo [3/3] Stopping database service (if running)...
set "DB_SERVICE="
for %%S in (MySQL80 MySQL MariaDB) do (
  sc query "%%S" >nul 2>&1
  if not errorlevel 1 set "DB_SERVICE=%%S"
)

if defined DB_SERVICE (
  sc query "%DB_SERVICE%" | findstr /I "RUNNING" >nul
  if errorlevel 1 (
    echo [OK] Database service already stopped: %DB_SERVICE%
  ) else (
    net stop "%DB_SERVICE%" >nul 2>&1
    if errorlevel 1 (
      echo [WARN] Could not stop %DB_SERVICE%. Try running this script as Administrator.
    ) else (
      echo [OK] Database service stopped: %DB_SERVICE%
    )
  )
) else (
  echo [WARN] No MySQL/MariaDB Windows service found.
)

echo.
echo [DONE] Shutdown sequence completed.

endlocal
