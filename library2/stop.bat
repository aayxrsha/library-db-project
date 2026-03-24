@echo off
setlocal

echo Stopping LMS services on ports 5000, 5173, and 5174...

powershell -NoProfile -ExecutionPolicy Bypass -Command "^$ports = 5000,5173,5174; ^$pids = @(); foreach (^$p in ^$ports) { ^$pids += (Get-NetTCPConnection -LocalPort ^$p -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess) }; ^$pids = ^$pids | Sort-Object -Unique; if (^$pids.Count -eq 0) { Write-Host 'No matching listeners found.'; exit 0 }; foreach (^$id in ^$pids) { try { Stop-Process -Id ^$id -Force -ErrorAction Stop; Write-Host ('Stopped PID ' + ^$id) } catch { Write-Host ('Could not stop PID ' + ^$id + ': ' + ^$_.Exception.Message) } }"

echo.
echo Done.
endlocal
