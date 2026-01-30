# Image Versioning Guide

This guide explains the image versioning strategy for the IoT Dashboard project.

## Version Strategy

All Docker images now use semantic versioning (SemVer):
- **Production**: `v1.0.0`, `v1.1.0`, `v2.0.0`, etc.
- **Development**: `v1.0.0-dev`, `v1.1.0-dev`, etc.
- **Latest**: Still tagged for local development convenience

## Current Version

**Current Version**: `v1.0.0`

## Building Images

### Option 1: Using the Build Script (Recommended)

**For production:**
```powershell
# Build with Minikube's Docker daemon
.\build-images.ps1 -Version "v1.0.0" -UseMinikube

# Build for external registry
.\build-images.ps1 -Version "v1.0.0"
```

**For development:**
```powershell
# Build dev version
.\build-images.ps1 -Version "v1.0.0" -Dev -UseMinikube
```

### Option 2: Manual Build

**Using Minikube's Docker daemon:**
```powershell
# Point to Minikube's Docker
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Build backend
docker build -t iot-dashboard-backend:v1.0.0 ./backend
docker tag iot-dashboard-backend:v1.0.0 iot-dashboard-backend:latest

# Build frontend
docker build -t iot-dashboard-frontend:v1.0.0 ./frontend
docker tag iot-dashboard-frontend:v1.0.0 iot-dashboard-frontend:latest
```

**For external registry:**
```powershell
# Build and tag
docker build -t your-registry/iot-dashboard-backend:v1.0.0 ./backend
docker build -t your-registry/iot-dashboard-frontend:v1.0.0 ./frontend

# Push to registry
docker push your-registry/iot-dashboard-backend:v1.0.0
docker push your-registry/iot-dashboard-frontend:v1.0.0
```

## Deploying

### Base Kubernetes Deployment

```powershell
# Deploy with versioned images (v1.0.0)
kubectl apply -k k8s/

# Verify deployment
kubectl get pods -n iot-dashboard
kubectl describe pod <pod-name> -n iot-dashboard
```

### Development Environment

```powershell
# Build dev images
.\build-images.ps1 -Version "v1.0.0" -Dev -UseMinikube

# Deploy to dev namespace
kubectl apply -k k8s/overlays/dev/
```

### Production Environment

```powershell
# Build production images
.\build-images.ps1 -Version "v1.0.0" -UseMinikube

# Deploy to prod namespace
kubectl apply -k k8s/overlays/prod/
```

## Updating to a New Version

### Step 1: Increment Version

Decide on the new version based on changes:
- **Patch** (v1.0.1): Bug fixes, minor changes
- **Minor** (v1.1.0): New features, backward compatible
- **Major** (v2.0.0): Breaking changes

### Step 2: Build New Images

```powershell
# Build new version
.\build-images.ps1 -Version "v1.1.0" -UseMinikube
```

### Step 3: Update Kustomization Files

**For base deployment** ([k8s/kustomization.yaml](k8s/kustomization.yaml)):
```yaml
images:
  - name: iot-dashboard-backend
    newName: iot-dashboard-backend
    newTag: v1.1.0  # Update version here
  - name: iot-dashboard-frontend
    newName: iot-dashboard-frontend
    newTag: v1.1.0  # Update version here
```

**For production** ([k8s/overlays/prod/kustomization.yaml](k8s/overlays/prod/kustomization.yaml)):
```yaml
images:
  - name: iot-dashboard-backend
    newTag: v1.1.0  # Update version here
  - name: iot-dashboard-frontend
    newTag: v1.1.0  # Update version here
```

### Step 4: Commit and Deploy

```powershell
# Commit changes
git add k8s/
git commit -m "Update to version v1.1.0"
git push

# If using ArgoCD, it will auto-sync
# Otherwise, apply manually:
kubectl apply -k k8s/
```

## Verifying Deployed Version

```powershell
# Check backend image version
kubectl get deployment backend -n iot-dashboard -o jsonpath='{.spec.template.spec.containers[0].image}'

# Check frontend image version
kubectl get deployment frontend -n iot-dashboard -o jsonpath='{.spec.template.spec.containers[0].image}'

# Check all images in use
kubectl get pods -n iot-dashboard -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'
```

## Rolling Back

### Option 1: Using ArgoCD

```powershell
# View application history
argocd app history iot-dashboard

# Rollback to previous version
argocd app rollback iot-dashboard
```

### Option 2: Using kubectl

```powershell
# Rollback deployment
kubectl rollout undo deployment/backend -n iot-dashboard
kubectl rollout undo deployment/frontend -n iot-dashboard

# Or rollback to specific revision
kubectl rollout undo deployment/backend -n iot-dashboard --to-revision=2
```

### Option 3: Update Kustomization and Reapply

```powershell
# Update k8s/kustomization.yaml to previous version
# Then apply
kubectl apply -k k8s/
```

## Docker Compose

The [docker-compose.yml](docker-compose.yml) file also uses versioned images:

```powershell
# Build and run with Docker Compose
docker-compose build
docker-compose up -d

# The images will be tagged as v1.0.0
```

## Best Practices

1. **Never use `latest` in production** - Always specify explicit versions
2. **Use semantic versioning** - Follow SemVer principles
3. **Tag images before pushing** - Ensure consistency across environments
4. **Keep image versions in sync** - Backend and frontend versions should match
5. **Document version changes** - Use Git tags and release notes
6. **Test before promoting** - Test in dev before deploying to prod
7. **Use image pull policy wisely**:
   - `Always`: For production with external registry
   - `IfNotPresent`: For Minikube/local development
   - `Never`: Only for Minikube-built images

## Troubleshooting

### Image Pull Errors

```powershell
# Check if image exists in Minikube
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker images | Select-String "iot-dashboard"

# If missing, rebuild
.\build-images.ps1 -Version "v1.0.0" -UseMinikube
```

### Wrong Version Deployed

```powershell
# Force recreate pods with new image
kubectl rollout restart deployment/backend -n iot-dashboard
kubectl rollout restart deployment/frontend -n iot-dashboard
```

### ImagePullBackOff

This usually means:
1. Image doesn't exist with that tag
2. Image pull policy is wrong for your setup
3. Not connected to the right Docker daemon (Minikube vs local)

**Solution:**
```powershell
# Verify images exist
docker images | Select-String "iot-dashboard"

# Check pod events
kubectl describe pod <pod-name> -n iot-dashboard

# Rebuild if needed
.\build-images.ps1 -Version "v1.0.0" -UseMinikube
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | 2026-01-30 | Initial versioned release |

## Next Steps

- Set up CI/CD to automatically build and tag images on release
- Configure ArgoCD Image Updater for automatic version updates
- Implement automated testing before version promotion
- Create release pipeline for production deployments
