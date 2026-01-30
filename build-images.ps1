# Build and tag Docker images with version
param(
    [string]$Version = "v1.0.0",
    [switch]$Dev,
    [switch]$UseMinikube
)

$ErrorActionPreference = "Stop"

# Determine the tag suffix
$Tag = if ($Dev) { "$Version-dev" } else { $Version }

Write-Host "Building images with tag: $Tag" -ForegroundColor Green

# If using Minikube, point to its Docker daemon
if ($UseMinikube) {
    Write-Host "Configuring Docker to use Minikube's daemon..." -ForegroundColor Cyan
    & minikube -p minikube docker-env --shell powershell | Invoke-Expression
}

# Build backend image
Write-Host "`nBuilding backend image..." -ForegroundColor Yellow
docker build -t iot-dashboard-backend:$Tag ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend build failed"
    exit 1
}

# Also tag as latest for local development
docker tag iot-dashboard-backend:$Tag iot-dashboard-backend:latest

# Build frontend image
Write-Host "`nBuilding frontend image..." -ForegroundColor Yellow
docker build -t iot-dashboard-frontend:$Tag ./frontend
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed"
    exit 1
}

# Also tag as latest for local development
docker tag iot-dashboard-frontend:$Tag iot-dashboard-frontend:latest

Write-Host "`nBuild completed successfully!" -ForegroundColor Green
Write-Host "Images created:" -ForegroundColor Cyan
docker images | Select-String "iot-dashboard"

Write-Host "`nTo deploy to Kubernetes, run:" -ForegroundColor Yellow
Write-Host "  kubectl apply -k k8s/" -ForegroundColor White
Write-Host "Or for dev environment:" -ForegroundColor Yellow
Write-Host "  kubectl apply -k k8s/overlays/dev/" -ForegroundColor White
Write-Host "Or for prod environment:" -ForegroundColor Yellow
Write-Host "  kubectl apply -k k8s/overlays/prod/" -ForegroundColor White
