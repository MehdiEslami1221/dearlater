@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || goto need_node
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)"
if errorlevel 1 goto need_node
if not exist node_modules\.bin\next.cmd (
  call npm ci
  if errorlevel 1 goto failed
)
if not exist .env.local copy /y .env.example .env.local >nul
if not exist .next\dearlater-appearance-v5 (
  call npm run build
  if errorlevel 1 goto failed
  echo built>.next\dearlater-appearance-v5
)
start "" /b powershell -NoProfile -Command "for($i=0;$i -lt 90;$i++){try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:3000/api/desk; if($r.Content -match 'configured'){Start-Process 'http://127.0.0.1:3000'; break}} catch {}; Start-Sleep -Seconds 1}"
call npm start -- --port 3000
if errorlevel 1 goto failed
exit /b 0
:need_node
echo Install Node.js 24 LTS or newer from nodejs.org, then run this file again.
:failed
pause
exit /b 1
