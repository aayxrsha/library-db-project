@echo off
setlocal

set "ROOT=%~dp0"

echo Starting LMS backend and frontend...

echo Starting backend in new window...
start "LMS Backend" cmd /k "cd /d ""%ROOT%backend"" && npm start"

echo Starting frontend in new window...
start "LMS Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"

echo.
echo Services started:
echo - Backend expected at http://localhost:5000
echo - Frontend expected at http://localhost:5173
echo.
echo Use stop.bat to stop both services.
endlocal
