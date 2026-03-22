@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "SERVER_DIR=%ROOT%server"
set "CLIENT_DIR=%ROOT%client"

echo ==============================================
echo  Library DB Project - Startup
echo ==============================================
echo Root: %ROOT%
echo.

if not exist "%SERVER_DIR%\package.json" (
  echo [ERROR] Server package.json not found at "%SERVER_DIR%".
  goto :end
)

if not exist "%CLIENT_DIR%\package.json" (
  echo [ERROR] Client package.json not found at "%CLIENT_DIR%".
  goto :end
)

echo [1/3] Checking database service...
set "DB_SERVICE="
for %%S in (MySQL80 MySQL MariaDB) do (
  sc query "%%S" >nul 2>&1
  if not errorlevel 1 set "DB_SERVICE=%%S"
)

if defined DB_SERVICE (
  sc query "%DB_SERVICE%" | findstr /I "RUNNING" >nul
  if errorlevel 1 (
    echo Starting database service: %DB_SERVICE%
    net start "%DB_SERVICE%" >nul 2>&1
    if errorlevel 1 (
      echo [WARN] Could not start %DB_SERVICE%. Try running this script as Administrator.
    ) else (
      echo [OK] Database service started: %DB_SERVICE%
    )
  ) else (
    echo [OK] Database service already running: %DB_SERVICE%
  )
) else (
  echo [WARN] No MySQL/MariaDB Windows service found. Start your DB manually if needed.
)

echo.
echo [2/3] Starting backend server...
start "Library Backend" cmd /k "cd /d "%SERVER_DIR%" && npm run start"

echo [3/3] Starting frontend dev server...
start "Library Frontend" cmd /k "cd /d "%CLIENT_DIR%" && npm run dev"

echo.
echo [DONE] Started services.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Close this window if you do not need logs here.

:end
endlocal
