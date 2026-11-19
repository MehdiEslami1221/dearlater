@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || goto need_node
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)"
if errorlevel 1 goto need_node
if not exist cloudflared.exe where cloudflared >nul 2>nul
if not exist cloudflared.exe if errorlevel 1 (
  echo Install Cloudflare Tunnel: winget install --id Cloudflare.cloudflared -e
  echo Then reopen this launcher.
  goto failed
)
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
node scripts/public-test.mjs
if errorlevel 1 goto failed
exit /b 0
:need_node
echo Install Node.js 24 LTS or newer.
:failed
pause
exit /b 1
