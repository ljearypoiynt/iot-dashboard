# Start port forwards in the background
# These need to run whenever Minikube restarts

Write-Host "Starting Kubernetes port forwards..." -ForegroundColor Cyan

# Kill any existing port forward jobs
Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Remove-Job -Force

# Start frontend port forward
Start-Job -Name "frontend-forward" -ScriptBlock { 
    kubectl port-forward svc/frontend-service -n iot-dashboard 3000:80 
}

# Start backend port forward  
Start-Job -Name "backend-forward" -ScriptBlock { 
    kubectl port-forward svc/backend-service -n iot-dashboard 5000:5000 
}

Write-Host "Port forwards started. View status with: Get-Job" -ForegroundColor Green
Get-Job
