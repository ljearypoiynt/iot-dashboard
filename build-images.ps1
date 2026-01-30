# Build and tag Docker images with version
param(
    [string]$Version,
    [switch]$Dev,
    [switch]$UseMinikube,
    [string]$VersionFile = "IMAGE_VERSION.txt"
)

$ErrorActionPreference = "Stop"

$VersionFilePath = if ([System.IO.Path]::IsPathRooted($VersionFile)) {
    $VersionFile
} else {
    Join-Path $PSScriptRoot $VersionFile
}

if (-not $Version) {
    if (Test-Path $VersionFilePath) {
        $Version = (Get-Content $VersionFilePath -TotalCount 1).Trim()
    } else {
        Write-Error "Version file not found: $VersionFilePath. Provide -Version or create the file."
        exit 1
    }
} else {
    Set-Content -Path $VersionFilePath -Value $Version -NoNewline
}

# Determine the tag suffix
$Tag = if ($Dev) { "$Version-dev" } else { $Version }

Write-Host "Building images with tag: $Tag" -ForegroundColor Green
Write-Host "Using version file: $VersionFilePath" -ForegroundColor Cyan

function Update-ImageTagInFile {
    param(
        [string]$FilePath,
        [string]$BackendTag,
        [string]$FrontendTag
    )

    if (-not (Test-Path $FilePath)) {
        Write-Host "Skipping missing file: $FilePath" -ForegroundColor DarkYellow
        return
    }

    $content = Get-Content -Path $FilePath -Raw
    $updated = $content
    $updated = $updated -replace "(iot-dashboard-backend:)([^\s\"']+)", "`$1$BackendTag"
    $updated = $updated -replace "(iot-dashboard-frontend:)([^\s\"']+)", "`$1$FrontendTag"

    if ($updated -ne $content) {
        Set-Content -Path $FilePath -Value $updated
        Write-Host "Updated image tags in $FilePath" -ForegroundColor Cyan
    } else {
        Write-Host "No image tags updated in $FilePath" -ForegroundColor DarkYellow
    }
}

# Update image tags in YAML files
$backendTag = $Tag
$frontendTag = $Tag
Update-ImageTagInFile -FilePath (Join-Path $PSScriptRoot "k8s/backend.yaml") -BackendTag $backendTag -FrontendTag $frontendTag
Update-ImageTagInFile -FilePath (Join-Path $PSScriptRoot "k8s/frontend.yaml") -BackendTag $backendTag -FrontendTag $frontendTag
Update-ImageTagInFile -FilePath (Join-Path $PSScriptRoot "docker-compose.yml") -BackendTag $backendTag -FrontendTag $frontendTag

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
