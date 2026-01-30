# IoT Dashboard - Quick Reference

## Project Overview
- **Frontend**: React TypeScript with Web Bluetooth API
- **Backend**: .NET 10 Web API
- **Database**: PostgreSQL 16
- **Deployment**: Kubernetes (Minikube) with ArgoCD GitOps

## Quick Commands

### Local Development
```powershell
# Backend
cd backend && dotnet run

# Frontend
cd frontend && npm start
```

### Docker Compose
```powershell
docker-compose up --build
# Access: http://localhost:8080
```

### Kubernetes (Minikube)
```powershell
# Deploy all services
kubectl apply -f k8s/

# Check status
kubectl get all -n iot-dashboard

# Access app
minikube service frontend-service -n iot-dashboard
```

### ArgoCD GitOps
```powershell
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Deploy application
kubectl apply -f argocd/application.yaml

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# https://localhost:8080
```

### Cloudflare Tunnel + ArgoCD (Production)
```powershell
# Run automated setup
.\setup-cloudflare-tunnel.ps1 -Domain "yourdomain.com"

# Or manual setup (see CLOUDFLARE_ARGOCD_SETUP.md)
cloudflared tunnel create iot-dashboard
cloudflared tunnel route dns iot-dashboard dashboard.yourdomain.com

# Commit and push
git add k8s/
git commit -m "Configure Cloudflare Tunnel"
git push origin main

# Sync with ArgoCD
argocd app sync iot-dashboard
```

## Deployment Options

| Option | Use Case | Pros | Cons |
|--------|----------|------|------|
| **Local Dev** | Development | Fast iteration, simple | Not production-ready |
| **Docker Compose** | Testing | Easy setup, isolated | Not scalable |
| **Minikube** | K8s learning | Local K8s environment | Resource intensive |
| **ArgoCD** | GitOps workflow | Declarative, automated | Requires K8s knowledge |
| **Cloudflare + ArgoCD** | Production | Secure, scalable, HTTPS | More complex setup |

## Documentation

### Deployment Guides
- [Quick Start Guide](QUICK_START.md) - Local development setup
- [Minikube Deployment](MINIKUBE_DEPLOYMENT.md) - Deploy to local Kubernetes
- [ArgoCD GitOps Setup](ARGOCD_DEPLOYMENT.md) - GitOps deployment with ArgoCD
- **[Cloudflare + ArgoCD Setup](CLOUDFLARE_ARGOCD_SETUP.md)** - Production-ready with secure tunnel

### Configuration & Setup
- [Database Setup](DATABASE_SETUP.md)
- [Cloudflare Tunnel (Local)](CLOUDFLARE_TUNNEL_SETUP.md) - Local development tunnel
- [Sealed Secrets Setup](SEALED_SECRETS_SETUP.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

## Repository Structure
```
iot-dashboard/
├── backend/              # .NET Core API
├── frontend/             # React TypeScript
├── k8s/                  # Kubernetes manifests
│   ├── base/             # Base configurations
│   └── overlays/         # Environment-specific configs
├── argocd/               # ArgoCD application definitions
├── esp32/                # ESP32 firmware
└── .github/workflows/    # CI/CD pipelines
```

## Ports
- Frontend: 3000 (dev), 8080 (docker), 30080 (k8s)
- Backend: 5000
- PostgreSQL: 5432
- ArgoCD: 8080

## Default Credentials
- **PostgreSQL**: iotuser / iotpassword123
- **ArgoCD**: admin / (get from secret)
