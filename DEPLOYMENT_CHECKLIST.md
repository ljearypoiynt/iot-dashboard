# 🚀 Cloudflare Tunnel + ArgoCD Deployment Checklist

Use this checklist to deploy the IoT Dashboard with Cloudflare Tunnel and ArgoCD.

## ☑️ Pre-Deployment Checklist

### Prerequisites
- [ ] Minikube installed and running
- [ ] kubectl configured and working
- [ ] ArgoCD installed in cluster
- [ ] Sealed Secrets controller installed
- [ ] cloudflared CLI installed
- [ ] Cloudflare account created
- [ ] Git repository set up (GitHub/GitLab)

### Verify Prerequisites
```powershell
# Check tools
cloudflared --version
kubectl version --client
kubeseal --version

# Check cluster
kubectl cluster-info
kubectl get nodes

# Check ArgoCD
kubectl get pods -n argocd

# Check Sealed Secrets
kubectl get pods -n kube-system | findstr sealed-secrets
```

## 🔧 Setup Steps

### 1. Cloudflare Tunnel Creation
- [ ] Run: `cloudflared tunnel login`
- [ ] Browser opens and authenticate
- [ ] Run: `cloudflared tunnel create iot-dashboard`
- [ ] Note the tunnel UUID from output
- [ ] Verify credentials at `~/.cloudflared/<UUID>.json`

### 2. DNS Configuration (Optional)
If using custom domain:
- [ ] Run: `cloudflared tunnel route dns iot-dashboard dashboard.yourdomain.com`
- [ ] Run: `cloudflared tunnel route dns iot-dashboard dashboardapi.yourdomain.com`
- [ ] Verify DNS records in Cloudflare Dashboard

### 3. Update Configuration
- [ ] Edit `k8s/cloudflare-tunnel-config.yaml`
- [ ] Update hostnames to your domain (or keep for auto-generated URL)
- [ ] Save the file

### 4. Create Sealed Secrets
```powershell
# Create unsealed secret (temporary)
kubectl create secret generic cloudflare-tunnel-credentials `
  --from-file=cert.pem=$env:USERPROFILE\.cloudflared\cert.pem `
  --from-file=credentials.json=$env:USERPROFILE\.cloudflared\<UUID>.json `
  --namespace=iot-dashboard `
  --dry-run=client -o yaml > cloudflare-temp-secret.yaml

# Seal the secret
kubeseal --format=yaml < cloudflare-temp-secret.yaml > k8s/cloudflare-tunnel-sealed-secret.yaml

# Delete temporary file
Remove-Item cloudflare-temp-secret.yaml
```

- [ ] Sealed secret created successfully
- [ ] Temporary file deleted
- [ ] Verify sealed secret file exists

### 5. Update Git Repository
```powershell
git add k8s/cloudflare-tunnel-config.yaml
git add k8s/cloudflare-tunnel-sealed-secret.yaml
git commit -m "Configure Cloudflare Tunnel for production"
git push origin main
```

- [ ] Changes committed
- [ ] Changes pushed to remote
- [ ] Verify on GitHub/GitLab

### 6. Deploy with ArgoCD
```powershell
# Option A: Auto-sync (if enabled)
# Wait for ArgoCD to detect changes (1-3 minutes)

# Option B: Manual sync
argocd app sync iot-dashboard

# Watch sync progress
argocd app wait iot-dashboard --health
```

- [ ] ArgoCD sync initiated
- [ ] Sync completed successfully
- [ ] All resources healthy

## ✅ Post-Deployment Verification

### 7. Verify Kubernetes Resources
```powershell
# Check all pods
kubectl get pods -n iot-dashboard

# Expected output:
# backend-xxx           1/1     Running
# cloudflare-tunnel-xxx 1/1     Running
# frontend-xxx          1/1     Running
# postgres-0            1/1     Running
```

- [ ] All pods showing 1/1 Ready
- [ ] All pods in Running status
- [ ] No pods in CrashLoopBackOff

### 8. Check Cloudflare Tunnel Logs
```powershell
kubectl logs -n iot-dashboard -l app=cloudflare-tunnel --tail=50
```

Expected logs:
- [ ] "Connection registered" message visible
- [ ] "Starting tunnel" message visible
- [ ] No error messages
- [ ] Tunnel UUID shown in logs

### 9. Test DNS Resolution
```powershell
# For custom domain:
nslookup dashboard.yourdomain.com
nslookup dashboardapi.yourdomain.com

# Should resolve to *.cfargotunnel.com
```

- [ ] DNS resolves correctly
- [ ] Points to Cloudflare tunnel

### 10. Test Application Access

#### Frontend Test
- [ ] Open: `https://dashboard.yourdomain.com` (or auto-generated URL)
- [ ] Page loads successfully
- [ ] HTTPS certificate valid
- [ ] No browser warnings

#### Backend API Test
```powershell
# Test API endpoint
curl https://dashboardapi.yourdomain.com/api/devices

# Or in browser:
# https://dashboardapi.yourdomain.com/api/devices
```

- [ ] API responds (empty array `[]` or devices list)
- [ ] HTTPS working
- [ ] No CORS errors

#### Full Flow Test
- [ ] Can scan for BLE devices
- [ ] Can connect to ESP32
- [ ] Can provision WiFi settings
- [ ] Device appears in dashboard
- [ ] Real-time updates working

## 🐛 Troubleshooting

### If Tunnel Pod Not Starting
```powershell
kubectl describe pod -n iot-dashboard -l app=cloudflare-tunnel
kubectl logs -n iot-dashboard -l app=cloudflare-tunnel
```

Common fixes:
- [ ] Verify sealed secret decrypted: `kubectl get secret cloudflare-tunnel-credentials -n iot-dashboard`
- [ ] Check credentials file format
- [ ] Restart pod: `kubectl rollout restart deployment/cloudflare-tunnel -n iot-dashboard`

### If 502 Bad Gateway
```powershell
# Test service connectivity
kubectl run test-pod --image=curlimages/curl -it --rm -- sh

# Inside pod:
curl http://frontend-service.iot-dashboard.svc.cluster.local:80
curl http://backend-service.iot-dashboard.svc.cluster.local:5000/api/devices
```

- [ ] Frontend service reachable
- [ ] Backend service reachable
- [ ] Services returning expected responses

### If DNS Not Resolving
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Check Cloudflare Dashboard DNS records
- [ ] Verify tunnel route: `cloudflared tunnel route ip show iot-dashboard`
- [ ] Check Cloudflare DNS is being used

### If ArgoCD Not Syncing
```powershell
# Check ArgoCD application status
argocd app get iot-dashboard

# Check for errors
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller
```

- [ ] Git repository accessible
- [ ] Credentials valid
- [ ] Path to k8s manifests correct
- [ ] No syntax errors in YAML files

## 📊 Performance Checks

### Monitor Resources
```powershell
# Check resource usage
kubectl top pods -n iot-dashboard

# Check tunnel metrics
kubectl port-forward -n iot-dashboard svc/cloudflare-tunnel 7844:7844
# Open: http://localhost:7844/metrics
```

- [ ] CPU usage reasonable (<50% idle)
- [ ] Memory usage stable
- [ ] No OOM kills

### Test Performance
- [ ] Page load time <3 seconds
- [ ] API response time <500ms
- [ ] WebSocket connections stable
- [ ] No timeouts

## 🔒 Security Verification

### Check Security Posture
- [ ] HTTPS enforced (no HTTP access)
- [ ] SSL certificate valid and trusted
- [ ] Sealed secrets encrypted in Git
- [ ] No plain credentials in repository
- [ ] ArgoCD using repo over HTTPS

### Optional Security Enhancements
- [ ] Enable Cloudflare WAF
- [ ] Set up rate limiting
- [ ] Configure Cloudflare Access
- [ ] Add IP allowlist
- [ ] Enable bot protection

## 📈 Monitoring Setup (Optional)

- [ ] Configure Cloudflare Analytics
- [ ] Set up alerting for tunnel disconnections
- [ ] Monitor ArgoCD sync status
- [ ] Track application metrics
- [ ] Set up log aggregation

## 🎉 Deployment Complete!

If all checks pass:
- ✅ Cloudflare Tunnel connected
- ✅ ArgoCD syncing automatically
- ✅ Application accessible via HTTPS
- ✅ All services healthy
- ✅ GitOps workflow active

## 📝 Post-Deployment Notes

Document the following for your team:

**Access URLs:**
- Frontend: _______________________
- Backend: _______________________
- ArgoCD: _______________________

**Tunnel Info:**
- Tunnel Name: iot-dashboard
- Tunnel UUID: _______________________

**Important Commands:**
```powershell
# View logs
kubectl logs -n iot-dashboard -l app=cloudflare-tunnel -f

# Restart tunnel
kubectl rollout restart deployment/cloudflare-tunnel -n iot-dashboard

# Sync with ArgoCD
argocd app sync iot-dashboard

# Check status
kubectl get all -n iot-dashboard
```

## 🔄 Making Updates

To deploy changes:
1. [ ] Update files in k8s/ directory
2. [ ] Test locally: `kubectl apply -k k8s/`
3. [ ] Commit and push to Git
4. [ ] ArgoCD auto-syncs (or manually sync)
5. [ ] Verify deployment

---

**Deployment Date**: _______________________
**Deployed By**: _______________________
**Notes**: _______________________

---

## 📚 Related Documentation
- [CLOUDFLARE_ARGOCD_SETUP.md](CLOUDFLARE_ARGOCD_SETUP.md) - Detailed setup guide
- [CLOUDFLARE_ARGOCD_INTEGRATION.md](CLOUDFLARE_ARGOCD_INTEGRATION.md) - Integration summary
- [REFERENCE.md](REFERENCE.md) - Quick reference
