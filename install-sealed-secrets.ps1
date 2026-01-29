#!/usr/bin/env powershell
# Install Sealed Secrets controller
Write-Host "Installing Sealed Secrets controller..." -ForegroundColor Cyan
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Wait for controller to be ready
Write-Host "Waiting for controller to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=sealed-secrets -n kube-system --timeout=60s

Write-Host "Sealed Secrets controller installed!" -ForegroundColor Green

# Install kubeseal CLI (Windows)
Write-Host "`nInstalling kubeseal CLI..." -ForegroundColor Cyan
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri "https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-0.24.0-windows-amd64.tar.gz" -OutFile kubeseal.tar.gz
tar -xzf kubeseal.tar.gz
Move-Item kubeseal.exe "C:\Program Files\Git\mingw64\bin\" -Force
Remove-Item kubeseal.tar.gz

Write-Host "kubeseal CLI installed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Create unencrypted secret: kubectl create secret generic cloudflare-tunnel-credentials --from-literal=credentials.json='...' --namespace iot-dashboard --dry-run=client -o yaml > /tmp/secret.yaml"
Write-Host "2. Seal it: kubeseal -f /tmp/secret.yaml -w k8s/cloudflare-tunnel-sealed-secret.yaml"
Write-Host "3. Commit the sealed secret to git"
