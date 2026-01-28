# Quick Setup for ArgoCD with GitHub

## Create and Push to GitHub

1. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name it: `iot-dashboard`
   - Make it public (or private with authentication)
   - Don't initialize with README (we already have files)

2. **Push your code**:
```powershell
# Initialize git if not already done
git init

# Add all files
git add .
git commit -m "Initial commit with ArgoCD setup"

# Add your GitHub repo as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/iot-dashboard.git

# Push to GitHub
git push -u origin main
```

3. **Update ArgoCD application**:
```powershell
# Edit argocd/application.yaml and set your repo URL
# Then apply:
kubectl apply -f argocd/application.yaml
```

## For Private Repository

If your repo is private, add credentials to ArgoCD:

```powershell
# Option A: Using HTTPS with token
kubectl create secret generic github-creds \
  -n argocd \
  --from-literal=username=YOUR_GITHUB_USERNAME \
  --from-literal=password=YOUR_GITHUB_TOKEN

# Label the secret
kubectl label secret github-creds -n argocd argocd.argoproj.io/secret-type=repository

# Add annotation with repo URL
kubectl annotate secret github-creds -n argocd \
  argocd.argoproj.io/repository-url=https://github.com/YOUR_USERNAME/iot-dashboard.git
```

**Generate GitHub Token**:
1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate new token (classic)
3. Select scope: `repo` (full control of private repositories)
4. Copy the token

## Option B: Use Helm to Install with Local Values

For local testing without Git, you can use ArgoCD with a different approach:

```powershell
# Delete the current application
kubectl delete -f argocd/application.yaml

# Apply manifests directly (bypass ArgoCD for now)
kubectl apply -f k8s/

# Check status
kubectl get all -n iot-dashboard
```

## Verify Repository Access

```powershell
# Check if ArgoCD can access the repo
argocd repo list

# Add repo manually via CLI
argocd repo add https://github.com/YOUR_USERNAME/iot-dashboard.git \
  --username YOUR_GITHUB_USERNAME \
  --password YOUR_GITHUB_TOKEN

# Or for public repos, just add without credentials
argocd repo add https://github.com/YOUR_USERNAME/iot-dashboard.git
```
