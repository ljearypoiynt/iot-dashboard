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

## Documentation
- [Quick Start Guide](QUICK_START.md)
- [Minikube Deployment](MINIKUBE_DEPLOYMENT.md)
- [ArgoCD GitOps Setup](ARGOCD_DEPLOYMENT.md)
- [Database Setup](DATABASE_SETUP.md)
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
