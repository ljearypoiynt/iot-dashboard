# Cloudflare Tunnel + ArgoCD + Kubernetes Setup

This guide explains how to deploy the IoT Dashboard with Cloudflare Tunnel using ArgoCD for GitOps-based deployment.

## Overview

The setup includes:
- **Cloudflare Tunnel**: Securely exposes your k8s services to the internet without opening ports
- **ArgoCD**: GitOps continuous delivery for Kubernetes
- **Sealed Secrets**: Encrypted secrets stored safely in Git
- **Kubernetes**: Container orchestration with Minikube

## Architecture

```
Internet → Cloudflare CDN → Cloudflare Tunnel Pod → K8s Services
                                                   ├─ Frontend Service
                                                   ├─ Backend Service
                                                   └─ PostgreSQL Service
```

## Prerequisites

1. ✅ Minikube running (see [MINIKUBE_DEPLOYMENT.md](MINIKUBE_DEPLOYMENT.md))
2. ✅ ArgoCD installed (see [ARGOCD_DEPLOYMENT.md](ARGOCD_DEPLOYMENT.md))
3. ✅ Sealed Secrets Controller installed (see [SEALED_SECRETS_SETUP.md](SEALED_SECRETS_SETUP.md))
4. ✅ Cloudflare account with domain or using Cloudflare's free tunnel URL
5. ✅ `cloudflared` CLI installed

## Step 1: Create Cloudflare Tunnel

First, authenticate with Cloudflare and create a tunnel:

```powershell
# Authenticate with Cloudflare
cloudflared tunnel login

# Create a new tunnel named 'iot-dashboard'
cloudflared tunnel create iot-dashboard

# Note the tunnel UUID from the output
# Example: Created tunnel iot-dashboard with id 0b0b67bc-20fa-400b-a3f9-b4bc8bbadd0e
```

This creates two files in `~/.cloudflared/`:
- `cert.pem` - Origin certificate for authentication
- `<UUID>.json` - Tunnel credentials

## Step 2: Configure DNS (Optional - for Custom Domain)

If you want to use your own domain:

```powershell
# Route your domain to the tunnel
cloudflared tunnel route dns iot-dashboard dashboard.poiynt.com
cloudflared tunnel route dns iot-dashboard dashboardapi.poiynt.com
```

Or configure in the Cloudflare Dashboard:
1. Go to your domain's DNS settings
2. Add CNAME records:
   - `dashboard` → `<TUNNEL_UUID>.cfargotunnel.com`
   - `dashboardapi` → `<TUNNEL_UUID>.cfargotunnel.com`

## Step 3: Update Cloudflare Configuration

Update the hostnames in [`k8s/cloudflare-tunnel-config.yaml`](k8s/cloudflare-tunnel-config.yaml):

```yaml
ingress:
  - hostname: dashboard.yourdomain.com  # Update this
    service: http://frontend-service.iot-dashboard.svc.cluster.local:80
  
  - hostname: dashboardapi.yourdomain.com  # Update this
    service: http://backend-service.iot-dashboard.svc.cluster.local:5000
  
  - service: http_status:404
```

Or for testing without a domain, use the auto-generated URL:

```yaml
ingress:
  - service: http://frontend-service.iot-dashboard.svc.cluster.local:80
```

Then run: `cloudflared tunnel route ip add 0.0.0.0/0 iot-dashboard`

## Step 4: Create Sealed Secrets

You need to seal your Cloudflare credentials for secure storage in Git:

```powershell
# Create temporary secret from your credentials
kubectl create secret generic cloudflare-tunnel-credentials `
  --from-file=cert.pem=$env:USERPROFILE\.cloudflared\cert.pem `
  --from-file=credentials.json=$env:USERPROFILE\.cloudflared\<YOUR_TUNNEL_UUID>.json `
  --namespace=iot-dashboard `
  --dry-run=client -o yaml > cloudflare-temp-secret.yaml

# Seal the secret
kubeseal --format=yaml < cloudflare-temp-secret.yaml > k8s/cloudflare-tunnel-sealed-secret.yaml

# Clean up temporary file
Remove-Item cloudflare-temp-secret.yaml
```

**Important**: Never commit the unsealed secret or actual credentials to Git!

## Step 5: Verify Kustomization

The [`k8s/kustomization.yaml`](k8s/kustomization.yaml) should now include:

```yaml
resources:
  - namespace.yaml
  - postgres.yaml
  - backend.yaml
  - frontend.yaml
  - cloudflare-tunnel-config.yaml
  - cloudflare-tunnel-sealed-secret.yaml
  - cloudflare-tunnel-deployment.yaml
```

✅ This has been configured for you.

## Step 6: Commit and Push to GitHub

```powershell
git add k8s/
git commit -m "Add Cloudflare Tunnel integration with ArgoCD"
git push origin main
```

## Step 7: Sync with ArgoCD

### Option 1: Automatic Sync (if enabled)

If your ArgoCD application has `automated` sync enabled, it will detect changes automatically.

### Option 2: Manual Sync via CLI

```powershell
# Sync the application
argocd app sync iot-dashboard

# Watch the sync status
argocd app wait iot-dashboard --health
```

### Option 3: Manual Sync via UI

1. Access ArgoCD UI: http://localhost:8080
2. Find the `iot-dashboard` application
3. Click "SYNC" → "SYNCHRONIZE"

## Step 8: Verify Deployment

```powershell
# Check all pods are running
kubectl get pods -n iot-dashboard

# Expected output:
# NAME                                  READY   STATUS    RESTARTS   AGE
# backend-xxxxxxxxxx-xxxxx             1/1     Running   0          2m
# cloudflare-tunnel-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
# frontend-xxxxxxxxxx-xxxxx            1/1     Running   0          2m
# postgres-0                           1/1     Running   0          2m

# Check cloudflared logs
kubectl logs -n iot-dashboard -l app=cloudflare-tunnel -f
```

You should see logs like:
```
INF Connection registered connIndex=0 ip=xxx.xxx.xxx.xxx location=XXX
INF Starting tunnel tunnel=iot-dashboard
```

## Step 9: Test Access

### With Custom Domain:
- Frontend: https://dashboard.yourdomain.com
- API: https://dashboardapi.yourdomain.com/api/devices

### With Auto-Generated URL:
Find your tunnel URL:
```powershell
cloudflared tunnel info iot-dashboard
```

Or check the Cloudflare Dashboard → Zero Trust → Access → Tunnels

## Troubleshooting

### Tunnel Pod Not Starting

```powershell
# Check pod status
kubectl describe pod -n iot-dashboard -l app=cloudflare-tunnel

# Common issues:
# 1. Credentials not properly sealed
# 2. ConfigMap not applied
# 3. Image pull issues
```

### Sealed Secret Not Decrypting

```powershell
# Check sealed-secrets controller logs
kubectl logs -n kube-system -l name=sealed-secrets-controller

# Verify sealed-secrets is running
kubectl get pods -n kube-system | findstr sealed-secrets
```

### DNS Not Resolving

```powershell
# Verify DNS records
nslookup dashboard.yourdomain.com

# Should return: <TUNNEL_UUID>.cfargotunnel.com
```

### 502 Bad Gateway

This usually means the tunnel is running but can't reach the backend services:

```powershell
# Verify services are running
kubectl get svc -n iot-dashboard

# Check service endpoints
kubectl get endpoints -n iot-dashboard

# Test connectivity from inside the tunnel pod
kubectl exec -n iot-dashboard -it deploy/cloudflare-tunnel -- sh
# Inside pod:
wget -O- http://frontend-service.iot-dashboard.svc.cluster.local:80
wget -O- http://backend-service.iot-dashboard.svc.cluster.local:5000/api/devices
```

### View Cloudflare Tunnel Logs

```powershell
# Follow logs in real-time
kubectl logs -n iot-dashboard -l app=cloudflare-tunnel -f

# Get recent logs
kubectl logs -n iot-dashboard -l app=cloudflare-tunnel --tail=100
```

## Updating Configuration

To update the Cloudflare tunnel configuration:

1. Edit [`k8s/cloudflare-tunnel-config.yaml`](k8s/cloudflare-tunnel-config.yaml)
2. Commit and push changes
3. ArgoCD will automatically sync (or manually sync)
4. The tunnel pod will reload the new configuration

## Security Best Practices

1. ✅ **Sealed Secrets**: Credentials are encrypted and safe in Git
2. ✅ **No Port Forwarding**: Cloudflare Tunnel handles ingress securely
3. ✅ **TLS Everywhere**: Automatic HTTPS via Cloudflare
4. 🔒 **WAF Rules**: Consider adding Cloudflare WAF rules for API protection
5. 🔒 **Access Policies**: Use Cloudflare Access for authentication (optional)

## Next Steps

- [ ] Configure Cloudflare WAF rules
- [ ] Set up Cloudflare Access for authentication
- [ ] Configure rate limiting
- [ ] Set up Cloudflare Analytics
- [ ] Add monitoring and alerting

## Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Sealed Secrets Documentation](https://github.com/bitnami-labs/sealed-secrets)
- [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md) - Local development setup
- [ARGOCD_DEPLOYMENT.md](ARGOCD_DEPLOYMENT.md) - ArgoCD installation guide
