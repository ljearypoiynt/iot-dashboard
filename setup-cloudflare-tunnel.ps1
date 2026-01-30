# Cloudflare Tunnel + ArgoCD Setup Script
# This script helps set up Cloudflare Tunnel with ArgoCD and Kubernetes

param(
    [Parameter(Mandatory=$false)]
    [string]$TunnelName = "iot-dashboard",
    
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "iot-dashboard",
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTunnelCreation,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

function Show-Help {
    Write-Host @"
Cloudflare Tunnel + ArgoCD Setup Script
========================================

Usage:
    .\setup-cloudflare-tunnel.ps1 [OPTIONS]

Options:
    -TunnelName <name>          Name of the Cloudflare tunnel (default: iot-dashboard)
    -Namespace <namespace>      Kubernetes namespace (default: iot-dashboard)
    -Domain <domain>            Your domain name (e.g., yourdomain.com)
    -SkipTunnelCreation        Skip tunnel creation if already exists
    -Help                      Show this help message

Examples:
    # Full setup with custom domain
    .\setup-cloudflare-tunnel.ps1 -Domain "poiynt.com"
    
    # Setup without creating new tunnel (if tunnel already exists)
    .\setup-cloudflare-tunnel.ps1 -Domain "poiynt.com" -SkipTunnelCreation
    
    # Setup with auto-generated Cloudflare URL
    .\setup-cloudflare-tunnel.ps1

Prerequisites:
    1. cloudflared CLI installed
    2. kubectl configured for your cluster
    3. kubeseal installed (for sealed-secrets)
    4. ArgoCD installed in cluster

"@
}

if ($Help) {
    Show-Help
    exit 0
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel + ArgoCD Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Yellow

$missingTools = @()

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    $missingTools += "cloudflared"
}
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    $missingTools += "kubectl"
}
if (-not (Get-Command kubeseal -ErrorAction SilentlyContinue)) {
    $missingTools += "kubeseal"
}

if ($missingTools.Count -gt 0) {
    Write-Host "❌ Missing required tools: $($missingTools -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install missing tools:" -ForegroundColor Yellow
    if ($missingTools -contains "cloudflared") {
        Write-Host "  cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor White
    }
    if ($missingTools -contains "kubectl") {
        Write-Host "  kubectl: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/" -ForegroundColor White
    }
    if ($missingTools -contains "kubeseal") {
        Write-Host "  kubeseal: choco install kubeseal" -ForegroundColor White
    }
    exit 1
}

Write-Host "✅ All prerequisites met" -ForegroundColor Green

# Authenticate with Cloudflare
if (-not $SkipTunnelCreation) {
    Write-Host ""
    Write-Host "[2/8] Authenticating with Cloudflare..." -ForegroundColor Yellow
    Write-Host "A browser window will open. Please log in to Cloudflare." -ForegroundColor White
    
    cloudflared tunnel login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to authenticate with Cloudflare" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Authenticated successfully" -ForegroundColor Green
    
    # Create tunnel
    Write-Host ""
    Write-Host "[3/8] Creating Cloudflare tunnel..." -ForegroundColor Yellow
    
    $tunnelOutput = cloudflared tunnel create $TunnelName 2>&1
    
    if ($LASTEXITCODE -ne 0 -and $tunnelOutput -notmatch "already exists") {
        Write-Host "❌ Failed to create tunnel" -ForegroundColor Red
        Write-Host $tunnelOutput -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Tunnel created: $TunnelName" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2-3/8] Skipping tunnel creation (already exists)" -ForegroundColor Yellow
}

# Get tunnel info
Write-Host ""
Write-Host "[4/8] Retrieving tunnel information..." -ForegroundColor Yellow

$tunnelInfo = cloudflared tunnel info $TunnelName -o json | ConvertFrom-Json
$tunnelUUID = $tunnelInfo.id

if (-not $tunnelUUID) {
    Write-Host "❌ Failed to get tunnel UUID" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tunnel UUID: $tunnelUUID" -ForegroundColor Green

# Configure DNS if domain provided
if ($Domain) {
    Write-Host ""
    Write-Host "[5/8] Configuring DNS records..." -ForegroundColor Yellow
    
    $frontendHostname = "dashboard.$Domain"
    $backendHostname = "dashboardapi.$Domain"
    
    Write-Host "Setting up DNS for: $frontendHostname and $backendHostname" -ForegroundColor White
    
    cloudflared tunnel route dns $TunnelName $frontendHostname
    cloudflared tunnel route dns $TunnelName $backendHostname
    
    Write-Host "✅ DNS records configured" -ForegroundColor Green
    
    # Update config file
    Write-Host ""
    Write-Host "[6/8] Updating Cloudflare tunnel configuration..." -ForegroundColor Yellow
    
    $configPath = "k8s/cloudflare-tunnel-config.yaml"
    
    if (Test-Path $configPath) {
        $configContent = Get-Content $configPath -Raw
        $configContent = $configContent -replace 'dashboard\.poiynt\.com', $frontendHostname
        $configContent = $configContent -replace 'dashboardapi\.poiynt\.com', $backendHostname
        $configContent | Set-Content $configPath
        
        Write-Host "✅ Configuration updated with your domain" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Config file not found at $configPath" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[5-6/8] Skipping DNS configuration (no domain provided)" -ForegroundColor Yellow
    Write-Host "You can access your app via Cloudflare's auto-generated URL" -ForegroundColor White
}

# Create sealed secret
Write-Host ""
Write-Host "[7/8] Creating sealed secret for Cloudflare credentials..." -ForegroundColor Yellow

$cloudflaredDir = "$env:USERPROFILE\.cloudflared"
$certPath = "$cloudflaredDir\cert.pem"
$credentialsPath = "$cloudflaredDir\$tunnelUUID.json"

if (-not (Test-Path $certPath)) {
    Write-Host "❌ Certificate not found at $certPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $credentialsPath)) {
    Write-Host "❌ Credentials not found at $credentialsPath" -ForegroundColor Red
    exit 1
}

# Create temporary secret
kubectl create secret generic cloudflare-tunnel-credentials `
    --from-file=cert.pem=$certPath `
    --from-file=credentials.json=$credentialsPath `
    --namespace=$Namespace `
    --dry-run=client -o yaml | Out-File -Encoding utf8 cloudflare-temp-secret.yaml

# Seal the secret
kubeseal --format=yaml --cert=kubeseal-cert.pem < cloudflare-temp-secret.yaml | Out-File -Encoding utf8 k8s/cloudflare-tunnel-sealed-secret.yaml

# Clean up temporary file
Remove-Item cloudflare-temp-secret.yaml

Write-Host "✅ Sealed secret created" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "[8/8] Setup complete! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Commit and push your changes:" -ForegroundColor White
Write-Host "   git add k8s/" -ForegroundColor Gray
Write-Host "   git commit -m 'Configure Cloudflare Tunnel'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Sync with ArgoCD:" -ForegroundColor White
Write-Host "   argocd app sync iot-dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Monitor deployment:" -ForegroundColor White
Write-Host "   kubectl get pods -n $Namespace -w" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check tunnel logs:" -ForegroundColor White
Write-Host "   kubectl logs -n $Namespace -l app=cloudflare-tunnel -f" -ForegroundColor Gray
Write-Host ""

if ($Domain) {
    Write-Host "5. Access your application:" -ForegroundColor White
    Write-Host "   Frontend: https://dashboard.$Domain" -ForegroundColor Gray
    Write-Host "   Backend:  https://dashboardapi.$Domain" -ForegroundColor Gray
} else {
    Write-Host "5. Get your tunnel URL:" -ForegroundColor White
    Write-Host "   cloudflared tunnel info $TunnelName" -ForegroundColor Gray
    Write-Host "   Or check Cloudflare Dashboard → Zero Trust → Tunnels" -ForegroundColor Gray
}

Write-Host ""
Write-Host "For detailed instructions, see CLOUDFLARE_ARGOCD_SETUP.md" -ForegroundColor White
Write-Host ""
