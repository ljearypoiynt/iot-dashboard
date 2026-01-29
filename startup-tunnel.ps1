# Complete startup script for IoT Dashboard Tunnel
# Run with: Right-click → Run with PowerShell (as Admin)

$ErrorActionPreference = "Continue"

Write-Host "=== IoT Dashboard Tunnel Startup ===" -ForegroundColor Cyan

# 1. Check if Minikube is running
Write-Host "`n[1/4] Checking Minikube status..." -ForegroundColor Yellow
$minikubeStatus = minikube status --format='{{.Host}}' 2>$null
if ($minikubeStatus -ne "Running") {
    Write-Host "Starting Minikube..." -ForegroundColor Green
    minikube start --cpus=4 --memory=4096
} else {
    Write-Host "Minikube already running" -ForegroundColor Green
}

# 2. Wait for services to be ready
Write-Host "`n[2/4] Waiting for services..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 3. Start port forwards
Write-Host "`n[3/4] Starting port forwards..." -ForegroundColor Yellow

# Kill existing port forwards if any
Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Remove-Job -Force

# Start new port forwards
$frontendJob = Start-Job -ScriptBlock { 
    kubectl port-forward svc/frontend-service -n iot-dashboard 3000:80 
}
$backendJob = Start-Job -ScriptBlock { 
    kubectl port-forward svc/backend-service -n iot-dashboard 5000:5000 
}

Write-Host "Frontend port forward started (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Write-Host "Backend port forward started (Job ID: $($backendJob.Id))" -ForegroundColor Green

# 4. Start Cloudflare Tunnel
Write-Host "`n[4/4] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "Tunnel URL will appear below:" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray

cloudflared tunnel run iot-dashboard
