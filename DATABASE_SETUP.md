# PostgreSQL Database Setup Guide

This guide explains how to set up and use PostgreSQL with your IoT Dashboard application.

## What's Been Added

### Database Components:
- **PostgreSQL 16** database for persistent data storage
- **Entity Framework Core** for ORM and migrations
- **Data Models**: IoTDevice and SensorData with proper relationships
- **Database Context**: ApplicationDbContext for data access

### Features:
- Automatic database migrations on startup
- Persistent storage for devices and sensor data
- JSONB columns for flexible metadata and data storage
- Proper indexes for performance
- Foreign key relationships between devices and sensor data

## Quick Start

### 1. For Docker Compose (Local Development)

```powershell
# Start all services including PostgreSQL
docker-compose up --build

# Access the app at http://localhost:8080
```

The database will be automatically created and migrations applied.

### 2. For Minikube (Kubernetes)

```powershell
# Make sure Minikube is running
minikube start --cpus=4 --memory=4096

# Use Minikube's Docker daemon
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Build images
docker build -t iot-dashboard-backend:latest ./backend
docker build -t iot-dashboard-frontend:latest ./frontend

# Deploy PostgreSQL first
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n iot-dashboard --timeout=120s

# Deploy backend and frontend
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Access the application
minikube service frontend-service -n iot-dashboard
```

### 3. For Local Development (Without Docker)

You'll need PostgreSQL installed locally:

```powershell
# Install PostgreSQL 16 for Windows from:
# https://www.postgresql.org/download/windows/

# Create the database
psql -U postgres
CREATE DATABASE iotdashboard;
CREATE USER iotuser WITH PASSWORD 'iotpassword123';
GRANT ALL PRIVILEGES ON DATABASE iotdashboard TO iotuser;
\q

# Run migrations (from backend directory)
cd backend
dotnet ef migrations add InitialCreate
dotnet ef database update

# Start the backend
dotnet run

# In another terminal, start the frontend
cd frontend
npm start
```

## Database Schema

### IoTDevice Table
- `Id` (PK): Unique device identifier
- `Name`: Device name
- `DeviceType`: Type of device (sensor_node, cloud_node, etc.)
- `BluetoothId`: Bluetooth identifier
- `IpAddress`: IP address (optional)
- `MacAddress`: MAC address
- `RegisteredAt`: Registration timestamp
- `LastSeen`: Last activity timestamp
- `Status`: Current status (Offline, Online, Provisioning, Error)
- `MetadataJson`: JSONB field for flexible metadata
- `CloudNodeId`: Reference to cloud node (for sensors)
- `AssignedSensorIdsJson`: JSONB array of assigned sensor IDs

### SensorData Table
- `Id` (PK): Unique data record identifier
- `DeviceId` (FK): Reference to IoTDevice
- `DeviceName`: Device name for display
- `ReceivedAt`: Data receipt timestamp
- `DataJson`: JSONB field for sensor readings

## Configuration

### Connection Strings

**Development** ([appsettings.Development.json](backend/appsettings.Development.json)):
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=iotdashboard;Username=iotuser;Password=iotpassword123"
}
```

**Docker Compose** ([docker-compose.yml](docker-compose.yml)):
```yaml
ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=iotdashboard;Username=iotuser;Password=iotpassword123"
```

**Kubernetes** ([k8s/backend.yaml](k8s/backend.yaml)):
```yaml
- name: ConnectionStrings__DefaultConnection
  value: "Host=postgres-service;Port=5432;Database=iotdashboard;Username=iotuser;Password=iotpassword123"
```

## Database Operations

### View Database in Kubernetes

```powershell
# Connect to PostgreSQL pod
kubectl exec -it deployment/postgres -n iot-dashboard -- psql -U iotuser -d iotdashboard

# List tables
\dt

# View devices
SELECT * FROM "Devices";

# View sensor data
SELECT * FROM "SensorData";

# Exit
\q
```

### View Database in Docker Compose

```powershell
# Connect to PostgreSQL container
docker exec -it iot-postgres psql -U iotuser -d iotdashboard

# Same SQL commands as above
```

### Create New Migration

```powershell
cd backend

# Create a new migration
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Rollback to previous migration
dotnet ef database update PreviousMigrationName

# Remove last migration (if not applied)
dotnet ef migrations remove
```

## Production Considerations

For production deployments:

1. **Use Secrets**: Store database credentials in Kubernetes Secrets or Azure Key Vault
2. **Persistent Storage**: Configure proper persistent volumes for PostgreSQL
3. **Backups**: Set up automated database backups
4. **Connection Pooling**: Configure appropriate connection pool size
5. **Security**: Use SSL/TLS for database connections
6. **Monitoring**: Add database performance monitoring
7. **Scaling**: Consider read replicas for high read workloads

### Example Kubernetes Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: iot-dashboard
type: Opaque
stringData:
  connection-string: "Host=postgres-service;Port=5432;Database=iotdashboard;Username=iotuser;Password=CHANGE_THIS_PASSWORD;SSL Mode=Require"
```

Then update backend deployment:
```yaml
- name: ConnectionStrings__DefaultConnection
  valueFrom:
    secretKeyRef:
      name: postgres-secret
      key: connection-string
```

## Troubleshooting

### Database Connection Issues

```powershell
# Check PostgreSQL pod status
kubectl get pods -n iot-dashboard -l app=postgres

# View PostgreSQL logs
kubectl logs deployment/postgres -n iot-dashboard

# Test connection from backend pod
kubectl exec -it deployment/backend -n iot-dashboard -- /bin/sh
# Inside pod:
apt-get update && apt-get install -y postgresql-client
psql -h postgres-service -U iotuser -d iotdashboard
```

### Migration Issues

```powershell
# List all migrations
cd backend
dotnet ef migrations list

# View migration SQL without applying
dotnet ef migrations script

# Force recreation (development only!)
dotnet ef database drop --force
dotnet ef database update
```

### Data Not Persisting

Check that the persistent volume claim is bound:
```powershell
kubectl get pvc -n iot-dashboard
```

## API Endpoints

All existing API endpoints now persist data to PostgreSQL:

- `POST /api/devices/register` - Register new device
- `GET /api/devices` - Get all devices
- `GET /api/devices/{id}` - Get device by ID
- `POST /api/sensor-data` - Save sensor data
- `GET /api/sensor-data` - Get all sensor data
- `GET /api/sensor-data/device/{deviceId}` - Get data for specific device

Data is automatically saved to the database and survives container restarts.
