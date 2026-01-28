# ArgoCD GitOps Deployment Guide

This guide explains how to deploy the IoT Dashboard using ArgoCD for GitOps-based continuous delivery.

## What is ArgoCD?

ArgoCD is a declarative, GitOps continuous delivery tool for Kubernetes. It automatically synchronizes your Kubernetes cluster with the desired state defined in your Git repository.

### Benefits:
- **GitOps Workflow**: Your Git repository is the single source of truth
- **Automated Sync**: Automatic deployment when you push changes
- **Easy Rollbacks**: Revert to any previous Git commit
- **Visual Dashboard**: See the state of all your applications
- **Multi-Environment**: Easily manage dev, staging, and production

## Prerequisites

- Minikube or any Kubernetes cluster
- kubectl installed and configured
- Git repository with your IoT Dashboard code

## Installation

### 1. Install ArgoCD on Minikube

```powershell
# Start Minikube if not already running
minikube start --cpus=4 --memory=4096

# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
```

### 2. Access ArgoCD UI

```powershell
# Port forward to access the UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Or use Minikube service (in a separate terminal)
minikube service argocd-server -n argocd --url
```

Access the UI at: https://localhost:8080

**Note**: Accept the self-signed certificate warning in your browser.

### 3. Get Admin Password

```powershell
# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }

# Login credentials:
# Username: admin
# Password: <output from above command>
```

### 4. Install ArgoCD CLI (Optional)

```powershell
# Download from: https://github.com/argoproj/argo-cd/releases/latest
# Or use Chocolatey:
choco install argocd-cli

# Login via CLI
argocd login localhost:8080
```

## Setup Your Git Repository

### 1. Push Your Code to Git

```powershell
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Add ArgoCD configuration"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/iot-dashboard.git

# Push to main branch
git push -u origin main
```

### 2. Update ArgoCD Application Manifest

Edit [argocd/application.yaml](argocd/application.yaml) and update the `repoURL`:

```yaml
source:
  repoURL: https://github.com/YOUR_USERNAME/iot-dashboard.git
  targetRevision: main
  path: k8s
```

## Deploy with ArgoCD

### Option 1: Using kubectl

```powershell
# Create the ArgoCD project (optional but recommended)
kubectl apply -f argocd/project.yaml

# Create the ArgoCD application
kubectl apply -f argocd/application.yaml

# Watch the sync status
kubectl get applications -n argocd -w
```

### Option 2: Using ArgoCD UI

1. Open ArgoCD UI (https://localhost:8080)
2. Click **+ NEW APP**
3. Fill in the details:
   - **Application Name**: iot-dashboard
   - **Project**: default (or iot-dashboard-project if you created it)
   - **Sync Policy**: Automatic
   - **Repository URL**: Your Git repo URL
   - **Revision**: main
   - **Path**: k8s
   - **Cluster URL**: https://kubernetes.default.svc
   - **Namespace**: iot-dashboard
4. Click **CREATE**

### Option 3: Using ArgoCD CLI

```powershell
# Login
argocd login localhost:8080

# Create the application
argocd app create iot-dashboard `
  --repo https://github.com/YOUR_USERNAME/iot-dashboard.git `
  --path k8s `
  --dest-server https://kubernetes.default.svc `
  --dest-namespace iot-dashboard `
  --sync-policy automated `
  --auto-prune `
  --self-heal

# Sync the application
argocd app sync iot-dashboard

# Watch the sync status
argocd app wait iot-dashboard
```

## Verify Deployment

```powershell
# Check application status
kubectl get applications -n argocd

# Check pods in iot-dashboard namespace
kubectl get pods -n iot-dashboard

# Check services
kubectl get svc -n iot-dashboard

# Access the application
minikube service frontend-service -n iot-dashboard
```

## Using Kustomize Overlays

The project includes Kustomize overlays for different environments:

### Deploy to Development

```powershell
# Update application to use dev overlay
kubectl patch application iot-dashboard -n argocd --type merge -p '{"spec":{"source":{"path":"k8s/overlays/dev"}}}'

# Or create a separate dev application
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: iot-dashboard-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_USERNAME/iot-dashboard.git
    targetRevision: main
    path: k8s/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: iot-dashboard-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF
```

### Deploy to Production

```powershell
# Create production application
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: iot-dashboard-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_USERNAME/iot-dashboard.git
    targetRevision: main
    path: k8s/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: iot-dashboard-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF
```

## GitOps Workflow

### Making Changes

1. **Edit Kubernetes manifests** in your local repository
2. **Commit and push** to Git:
   ```powershell
   git add .
   git commit -m "Update backend replicas"
   git push
   ```
3. **ArgoCD automatically syncs** the changes (if auto-sync is enabled)
4. **Verify** in ArgoCD UI or CLI:
   ```powershell
   argocd app get iot-dashboard
   ```

### Manual Sync

If auto-sync is disabled:

```powershell
# Sync via CLI
argocd app sync iot-dashboard

# Or via UI: Click "SYNC" button in ArgoCD dashboard
```

### Rollback

```powershell
# Rollback to previous version via CLI
argocd app rollback iot-dashboard

# Or in UI: Go to History tab and select a previous version
```

## Building and Pushing Images

For ArgoCD to work with new image versions:

### Using Minikube's Docker Registry

```powershell
# Point to Minikube's Docker daemon
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Build images
docker build -t iot-dashboard-backend:v1.0.0 ./backend
docker build -t iot-dashboard-frontend:v1.0.0 ./frontend

# Update image tags in kustomization.yaml
# Commit and push
git add k8s/kustomization.yaml
git commit -m "Update to v1.0.0"
git push
```

### Using External Registry (Production)

```powershell
# Tag for your registry
docker tag iot-dashboard-backend:latest YOUR_REGISTRY/iot-dashboard-backend:v1.0.0
docker tag iot-dashboard-frontend:latest YOUR_REGISTRY/iot-dashboard-frontend:v1.0.0

# Push to registry
docker push YOUR_REGISTRY/iot-dashboard-backend:v1.0.0
docker push YOUR_REGISTRY/iot-dashboard-frontend:v1.0.0

# Update image names in kustomization.yaml to use YOUR_REGISTRY
# Commit and push changes
```

## Monitoring and Debugging

### View Application Status

```powershell
# Get application info
argocd app get iot-dashboard

# View sync status
argocd app sync-status iot-dashboard

# View application resources
kubectl get all -n iot-dashboard
```

### View Logs

```powershell
# View ArgoCD application controller logs
kubectl logs -n argocd deployment/argocd-application-controller

# View application pod logs
kubectl logs -n iot-dashboard deployment/backend
kubectl logs -n iot-dashboard deployment/frontend
```

### Common Issues

**Out of Sync**: Application shows as "OutOfSync"
```powershell
# Check differences
argocd app diff iot-dashboard

# Force sync
argocd app sync iot-dashboard --force
```

**Image Pull Errors**: Using imagePullPolicy: Never for local images
```powershell
# Ensure images are built in Minikube's Docker daemon
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker images | Select-String "iot-dashboard"
```

**Database Connection Issues**:
```powershell
# Check if PostgreSQL is running
kubectl get pods -n iot-dashboard -l app=postgres

# Check backend logs
kubectl logs -n iot-dashboard deployment/backend
```

## ArgoCD Best Practices

1. **Use Separate Apps for Environments**: Create separate ArgoCD applications for dev, staging, and production
2. **Version Your Images**: Use semantic versioning (v1.0.0) instead of `latest` in production
3. **Enable Auto-Sync with Caution**: Auto-sync is great for dev, but consider manual sync for production
4. **Use Sync Waves**: Control deployment order with `argocd.argoproj.io/sync-wave` annotation
5. **Monitor Sync Status**: Set up alerts for sync failures
6. **Use Projects**: Isolate applications with ArgoCD Projects for better security
7. **Enable Pruning**: Auto-prune resources that are no longer in Git
8. **Self-Heal**: Enable self-heal to automatically fix drift

## Cleanup

```powershell
# Delete the application
argocd app delete iot-dashboard

# Or using kubectl
kubectl delete application iot-dashboard -n argocd

# Uninstall ArgoCD
kubectl delete namespace argocd
```

## Next Steps

- Set up **GitHub Actions** or **GitLab CI** to build and push Docker images on commit
- Configure **ArgoCD Image Updater** to automatically update image tags
- Set up **ArgoCD Notifications** for Slack/email alerts
- Implement **Progressive Delivery** with Argo Rollouts for canary deployments
- Use **Sealed Secrets** or **External Secrets Operator** for secret management

## Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kustomize Documentation](https://kustomize.io/)
- [GitOps Principles](https://opengitops.dev/)
