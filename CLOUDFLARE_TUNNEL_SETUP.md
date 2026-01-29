# Cloudflare Tunnel Setup for IoT Dashboard

This guide will help you expose your local Minikube-hosted IoT Dashboard to the internet using Cloudflare Tunnel.

## What is Cloudflare Tunnel?

Cloudflare Tunnel (formerly Argo Tunnel) connects your local infrastructure to Cloudflare's network without exposing your local IP or opening ports. It provides:
- Free SSL/TLS encryption
- DDoS protection
- Global CDN acceleration
- No firewall/NAT configuration needed
- Easy public URL sharing

## Prerequisites

1. **Cloudflare Account** - [Sign up free](https://dash.cloudflare.com/sign-up)
2. **Domain or Subdomain** - Either:
   - Own domain added to Cloudflare, OR
   - Use Cloudflare's free `*.pages.dev` subdomain, OR
   - Use Cloudflare Tunnel's automatically generated URL
3. **Minikube Running** - See [MINIKUBE_DEPLOYMENT.md](MINIKUBE_DEPLOYMENT.md)
4. **Services Deployed** - Backend and Frontend running in Kubernetes

## Step 1: Install Cloudflare Tunnel CLI

### Windows (PowerShell)

```powershell
# Using Chocolatey (if installed)
choco install cloudflare-warp

# Or download directly from GitHub
# https://github.com/cloudflare/warp-cli/releases
# Then add to PATH
```

### Verify Installation

```bash
cloudflared --version
```

## Step 2: Authenticate with Cloudflare

```bash
# This opens your browser to authenticate
cloudflared tunnel login
```

A browser window will open. Log in to your Cloudflare account and authorize the tunnel creation.

After authentication, a certificate is saved to:
- Windows: `C:\Users\<YourUser>\.cloudflared\cert.pem`

## Step 3: Create the Tunnel

```bash
# Create a new tunnel
cloudflared tunnel create iot-dashboard

# You'll see output like:
# Tunnel credentials written to C:\Users\<YourUser>\.cloudflared\<UUID>.json
# Tunnel <UUID> created. Note that currently this tunnel is disconnected.
```

Save the tunnel ID (UUID) for later reference.

## Step 4: Configure the Tunnel

Create a configuration file at `C:\Users\leeje\.cloudflared\config.yml`:

```yaml
# Configuration for IoT Dashboard Tunnel
tunnel: iot-dashboard
credentials-file: C:\Users\leeje\.cloudflared\0b0b67bc-20fa-400b-a3f9-b4bc8bbadd0e.json

# Ingress rules - route traffic to your services
ingress:
  # Frontend service
  - hostname: dashboard.example.com
    service: http://localhost:3000
  
  # Backend API service
  - hostname: api.example.com
    service: http://localhost:5000
  
  # If using localhost only (without custom domains)
  - service: http_status:404

# Logging
loglevel: info
```

### For Local Testing (Without Custom Domain)

If you don't have a custom domain yet, use this simpler config:

```yaml
tunnel: iot-dashboard
credentials-file: C:\Users\<YourUser>\.cloudflared\<YOUR_TUNNEL_UUID>.json

ingress:
  - service: http://localhost:3000
  
loglevel: info
```

You'll get a public URL automatically.

## Step 5: Create Port Forwards (Required for Local Access)

Since Minikube services aren't directly on localhost, create port forwards:

### In a Terminal (keep running):

```bash
# Forward frontend
kubectl port-forward svc/frontend-service -n iot-dashboard 3000:80

# In another terminal, forward backend
kubectl port-forward svc/backend-service -n iot-dashboard 5000:5000
```

**Or** use a PowerShell script to start both:

Create `start-tunnels.ps1`:

```powershell
# Start port forwards in background
Start-Job -ScriptBlock { kubectl port-forward svc/frontend-service -n iot-dashboard 3000:80 }
Start-Job -ScriptBlock { kubectl port-forward svc/backend-service -n iot-dashboard 5000:5000 }

Write-Host "Port forwards started in background"
Get-Job
```

Run it:
```powershell
.\start-tunnels.ps1
```

## Step 6: Run the Tunnel

```bash
# Start the tunnel (keep this running)
cloudflared tunnel run iot-dashboard
```

You should see output like:
```
2026-01-29T10:30:00Z INF Connection XXXX registered with protocol: h2mux
2026-01-29T10:30:01Z INF Route published:
https://dashboard-XXXX.trycloudflare.com
```

**Copy this URL** - it's your public internet access point!

## Step 7: Configure DNS (Optional - For Custom Domain)

If you own a domain registered with Cloudflare:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain
3. Go to DNS > Records
4. Add CNAME record:
   - **Name**: `dashboard` (or your subdomain)
   - **Target**: `<your-tunnel-id>.cfargotunnel.com`
   - **Proxy Status**: Proxied

Then update your `config.yml` to use your domain:
```yaml
ingress:
  - hostname: dashboard.yourdomain.com
    service: http://localhost:3000
  
  - hostname: api.yourdomain.com
    service: http://localhost:5000
```

Restart the tunnel:
```bash
cloudflared tunnel run iot-dashboard
```

## Step 8: Access Your Services

### Using Auto-Generated URL
```
https://dashboard-XXXX.trycloudflare.com
```

### Using Custom Domain (if configured)
```
https://dashboard.yourdomain.com
https://api.yourdomain.com
```

**Note**: First visit may show security warning - this is normal for self-signed certs behind the tunnel.

## Step 9: Keep Everything Running

Create a PowerShell script `start-all.ps1` to automate startup:

```powershell
# Start Minikube
Write-Host "Starting Minikube..."
minikube start --cpus=4 --memory=4096

# Start port forwards
Write-Host "Starting port forwards..."
Start-Job -ScriptBlock { kubectl port-forward svc/frontend-service -n iot-dashboard 3000:80 }
Start-Job -ScriptBlock { kubectl port-forward svc/backend-service -n iot-dashboard 5000:5000 }

# Start Cloudflare tunnel
Write-Host "Starting Cloudflare Tunnel..."
Write-Host "Access your services at the tunnel URL shown below:"
cloudflared tunnel run iot-dashboard
```

Run it:
```powershell
.\start-all.ps1
```

## Run on Startup (Windows)

### Option 1: Install as Windows Service (Recommended)

This is the most reliable method - the tunnel will start automatically with Windows:

```powershell
# Install cloudflared as a Windows service
cloudflared service install
```

This automatically:
- Creates a Windows service named "cloudflared"
- Reads your config from `C:\Users\leeje\.cloudflared\config.yml`
- Starts on boot
- Restarts automatically if it crashes

Manage the service:
```powershell
# Start service
sc start cloudflared

# Stop service
sc stop cloudflared

# Check status
sc query cloudflared

# Uninstall service (if needed)
cloudflared service uninstall
```

**Note**: You still need to start port forwards manually (see Option 3 below).

### Option 2: Windows Task Scheduler

Create a task that runs the tunnel on login:

1. Open Task Scheduler (Win + R, type `taskschd.msc`)
2. Click "Create Task" (not Basic Task)
3. **General Tab:**
   - Name: `Cloudflare IoT Tunnel`
   - Check "Run with highest privileges"
   - Configure for: Windows 10
4. **Triggers Tab:**
   - New → Begin the task: "At log on"
   - Specific user: Your username
5. **Actions Tab:**
   - New → Action: "Start a program"
   - Program/script: `cloudflared`
   - Arguments: `tunnel run iot-dashboard`
   - Start in: `C:\Users\leeje\.cloudflared`
6. **Conditions Tab:**
   - Uncheck "Start only if on AC power" (for laptops)
7. Click OK

### Option 3: Complete Startup Script

Create `C:\git\iot-dashboard\startup-tunnel.ps1`:

```powershell
# Complete startup script for IoT Dashboard Tunnel
# Run with: Right-click → Run with PowerShell (as Admin)

$ErrorActionPreference = "Continue"

Write-Host "=== IoT Dashboard Tunnel Startup ===" -ForegroundColor Cyan

# 1. Check if Minikube is running
Write-Host "`n[1/4] Checking Minikube status..." -ForegroundColor Yellow
$minikubeStatus = minikube status --format='{{.Host}}' 2>$null
if ($minikubeStatus -ne "Running") {
    Write-Host "Starting Minikube..." -ForegroundColor Green
    minikube start --cpus=4 --memory=4096
} else {
    Write-Host "Minikube already running" -ForegroundColor Green
}

# 2. Wait for services to be ready
Write-Host "`n[2/4] Waiting for services..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 3. Start port forwards
Write-Host "`n[3/4] Starting port forwards..." -ForegroundColor Yellow

# Kill existing port forwards if any
Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Remove-Job -Force

# Start new port forwards
$frontendJob = Start-Job -ScriptBlock { 
    kubectl port-forward svc/frontend-service -n iot-dashboard 3000:80 
}
$backendJob = Start-Job -ScriptBlock { 
    kubectl port-forward svc/backend-service -n iot-dashboard 5000:5000 
}

Write-Host "Frontend port forward started (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Write-Host "Backend port forward started (Job ID: $($backendJob.Id))" -ForegroundColor Green

# 4. Start Cloudflare Tunnel
Write-Host "`n[4/4] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "Tunnel URL will appear below:" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray

cloudflared tunnel run iot-dashboard
```

Then create a Task Scheduler task to run this script on startup:
- Program/script: `powershell.exe`
- Arguments: `-ExecutionPolicy Bypass -File "C:\git\iot-dashboard\startup-tunnel.ps1"`
- Start in: `C:\git\iot-dashboard`

### Option 4: Startup Folder Shortcut (Simple but Less Reliable)

1. Create a batch file `C:\git\iot-dashboard\start-tunnel.bat`:

```batch
@echo off
cd /d C:\Users\leeje\.cloudflared
start /min cloudflared tunnel run iot-dashboard
```

2. Create a shortcut to this batch file
3. Press `Win + R`, type `shell:startup`, press Enter
4. Copy the shortcut to the Startup folder

### Background Port Forwards Script

Create `C:\git\iot-dashboard\start-port-forwards.ps1`:

```powershell
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
```

Run this whenever you restart Minikube:
```powershell
.\start-port-forwards.ps1
```

## Useful Commands

### List Running Tunnels
```bash
cloudflared tunnel list
```

### View Tunnel Status
```bash
cloudflared tunnel status iot-dashboard
```

### Delete Tunnel (when done)
```bash
cloudflared tunnel delete iot-dashboard
```

### View Tunnel Logs
```bash
cloudflared tunnel logs iot-dashboard
```

## Troubleshooting

### "Failed to authenticate" Error
- Run `cloudflared tunnel login` again
- Ensure browser allows pop-ups from Cloudflare

### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Services Not Reachable
1. Verify port forwards are running: `kubectl get port-forward`
2. Test locally first: `curl http://localhost:3000`
3. Check Cloudflare logs: `cloudflared tunnel logs iot-dashboard`

### CORS Issues
Your backend CORS settings in `Program.cs` should allow the tunnel URL:

```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowTunnel", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
```

## Security Considerations

✅ **What Cloudflare Tunnel Protects:**
- Your local IP is never exposed
- All traffic is encrypted (SSL/TLS)
- DDoS protection included
- Firewall rules available

⚠️ **What You Should Do:**
- Enable authentication if sensitive data
- Use Cloudflare Access for role-based access control
- Monitor tunnel logs for suspicious activity
- Keep credentials file secure

## Advanced: Cloudflare Access (Optional)

To require login before accessing your dashboard:

1. Go to Cloudflare Dashboard > Zero Trust > Access > Applications
2. Create new application with your tunnel URL
3. Add access rules (e.g., specific email domain)

Users must authenticate before accessing your services.

## Reference

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [config.yml Reference](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/#configuration-file)
- [Troubleshooting Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/troubleshooting/)
