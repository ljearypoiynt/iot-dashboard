# Deploying IoT Dashboard to Minikube

This guide will help you deploy the IoT Dashboard application to a local Minikube cluster.

## Prerequisites

1. **Install Minikube**: [Download Minikube](https://minikube.sigs.k8s.io/docs/start/)
2. **Install kubectl**: [Download kubectl](https://kubernetes.io/docs/tasks/tools/)
3. **Install Docker**: [Download Docker](https://www.docker.com/products/docker-desktop/)

## Quick Start

### 1. Start Minikube

```bash
# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=4096

# Enable necessary addons
minikube addons enable ingress
```

### 2. Build Docker Images

Build the Docker images inside Minikube's Docker environment so they're available to Kubernetes:

```bash
# Point your shell to Minikube's Docker daemon
minikube docker-env
# On Windows PowerShell, run:
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Build backend image
cd backend
docker build -t iot-dashboard-backend:latest .

# Build frontend image
cd ../frontend
docker build -t iot-dashboard-frontend:latest .

cd ..
```

### 3. Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy backend
kubectl apply -f k8s/backend.yaml

# Deploy frontend
kubectl apply -f k8s/frontend.yaml

# Verify deployments
kubectl get all -n iot-dashboard
```

### 4. Access the Application

```bash
# Get the Minikube IP
minikube ip

# Access the application at:
# http://<minikube-ip>:30080
```

Or use the Minikube service command for easy access:

```bash
minikube service frontend-service -n iot-dashboard
```

## Useful Commands

### Check Pod Status

```bash
kubectl get pods -n iot-dashboard
```

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n iot-dashboard

# Frontend logs
kubectl logs -f deployment/frontend -n iot-dashboard
```

### Scale Deployments

```bash
# Scale backend
kubectl scale deployment backend --replicas=2 -n iot-dashboard

# Scale frontend
kubectl scale deployment frontend --replicas=2 -n iot-dashboard
```

### Update Images

After rebuilding images:

```bash
# Restart deployments to use new images
kubectl rollout restart deployment/backend -n iot-dashboard
kubectl rollout restart deployment/frontend -n iot-dashboard
```

### Delete Deployment

```bash
# Delete all resources
kubectl delete namespace iot-dashboard
```

## Troubleshooting

### Pods not starting

```bash
# Describe the pod to see events
kubectl describe pod <pod-name> -n iot-dashboard

# Check pod logs
kubectl logs <pod-name> -n iot-dashboard
```

### Image pull errors

Make sure you built the images inside Minikube's Docker daemon:

```bash
# Set Docker environment
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Verify images exist
docker images | Select-String "iot-dashboard"
```

### Service not accessible

```bash
# Check service endpoints
kubectl get endpoints -n iot-dashboard

# Check service details
kubectl describe service frontend-service -n iot-dashboard
```

### Access dashboard from browser

```bash
# Open Minikube dashboard
minikube dashboard
```

## Health Checks

The backend includes health check endpoints at `/api/health`. You can verify:

```bash
# Port forward to backend
kubectl port-forward service/backend-service 5000:5000 -n iot-dashboard

# Check health (in another terminal)
curl http://localhost:5000/api/health
```

## Production Considerations

For production deployments:

1. Use proper image tags (not `:latest`)
2. Set up persistent storage for database
3. Configure proper resource limits
4. Add horizontal pod autoscaling
5. Set up ingress with SSL/TLS
6. Use ConfigMaps and Secrets for configuration
7. Implement proper monitoring and logging
8. Use a managed Kubernetes service (AKS, EKS, GKE)

## Alternative: Docker Compose (Development)

For local development without Kubernetes, see [docker-compose.yml](../docker-compose.yml):

```bash
docker-compose up --build
```

## Notes

- The frontend service uses NodePort type on port 30080 for easy access
- The backend service uses ClusterIP type (internal only)
- Health checks are configured for both services
- Resource limits are set conservatively for Minikube
- Images use `imagePullPolicy: Never` since they're built locally
