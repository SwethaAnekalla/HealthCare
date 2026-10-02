# CareSync Development Startup Script

Write-Host "🚀 CareSync Development Environment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "`n📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

# Check backend dependencies
if (!(Test-Path "apps/api/node_modules")) {
    Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install --workspace=apps/api
}

# Check frontend dependencies
if (!(Test-Path "apps/web/node_modules")) {
    Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install --workspace=apps/web
}

Write-Host "`n✅ All dependencies installed!" -ForegroundColor Green

Write-Host "`n📋 Project Information:" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "  Frontend Web: http://localhost:5173" -ForegroundColor White
Write-Host "  WebSocket: ws://localhost:3000" -ForegroundColor White

Write-Host "`n👤 Demo Accounts:" -ForegroundColor Cyan
Write-Host "  Patient: patient@caresync.com / password123" -ForegroundColor White
Write-Host "  Doctor: dr.sharma@caresync.com / password123" -ForegroundColor White
Write-Host "  Admin: admin@caresync.com / password123" -ForegroundColor White
Write-Host "  Agent: agent@caresync.com / password123" -ForegroundColor White
Write-Host "  Staff: staff@caresync.com / password123" -ForegroundColor White

Write-Host "`n⚠️  Note: Database setup required" -ForegroundColor Yellow
Write-Host "  If PostgreSQL/Redis not available, some features will be limited" -ForegroundColor Yellow

Write-Host "`n🎯 Starting development servers..." -ForegroundColor Green
Write-Host "   - Backend (Express) on port 3000" -ForegroundColor White
Write-Host "   - Frontend (Vite) on port 5173" -ForegroundColor White

# Start backend
Write-Host "`n[1/2] Starting Backend API..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/../apps/api'; npm run dev" -PassThru | Out-Null

# Wait a moment
Start-Sleep -Seconds 2

# Start frontend  
Write-Host "[2/2] Starting Frontend Web..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/../apps/web'; npm run dev" -PassThru | Out-Null

Write-Host "`n✨ Development servers starting!" -ForegroundColor Green
Write-Host "  - Check backend terminal for API server status" -ForegroundColor White
Write-Host "  - Check frontend terminal for Vite dev server status" -ForegroundColor White
Write-Host "`n  Open browser to: http://localhost:5173" -ForegroundColor Cyan
