# Shared PostgreSQL Instance Setup

## Overview

As of this update, both `iot-dashboard` and `musicnenaghneurofuse` share a single PostgreSQL instance deployed in the `shared-data` namespace. This approach reduces resource consumption and simplifies database administration.

## Migration Notes

### Previous Setup (Per-App Database)

- Each application had its own PostgreSQL deployment
- Separate storage and resources per app
- Separate configuration and credentials

### New Setup (Shared Database)

- Single PostgreSQL instance in `shared-data` namespace
- Each application has its own database within the instance
- ExternalName services provide namespace-local access
- Reduced resource footprint and operational overhead

## Databases in Shared Instance

```
PostgreSQL Instance (shared-data)
├── musicnenaghneurofuse (Drizzle ORM)
└── iotdashboard (.NET Entity Framework)
```

## Connection Details

### From iot-dashboard namespace:

```
Host: postgres-service.shared-data.svc.cluster.local
Port: 5432
Database: iotdashboard
Username: postgres
Password: postgrespassword123 (in shared-data/postgres-secret)
```

### From musicnenaghneurofuse namespace:

```
Host: postgres-service.shared-data.svc.cluster.local
Port: 5432
Database: musicnenaghneurofuse
Username: postgres
Password: postgrespassword123 (in shared-data/postgres-secret)
```

## Migration from Single-Instance Setup

If you're upgrading from the old setup where each app had its own postgres:

### Step 1: Deploy Shared Postgres

```bash
# Apply shared postgres resources
kubectl apply -f k8s/postgres-shared.yaml
```

### Step 2: Wait for Shared Postgres

```bash
# Verify shared-data namespace exists
kubectl get namespace shared-data

# Wait for postgres pod
kubectl wait --for=condition=ready pod \
  -l app=postgres \
  -n shared-data \
  --timeout=300s
```

### Step 3: Create Databases

```bash
# Create musicnenaghneurofuse database
kubectl exec -n shared-data deployment/postgres -- \
  psql -U postgres -c "CREATE DATABASE musicnenaghneurofuse;"

# Create iotdashboard database
kubectl exec -n shared-data deployment/postgres -- \
  psql -U postgres -c "CREATE DATABASE iotdashboard;"
```

### Step 4: Migrate Data (if existing)

```bash
# Backup old iotdashboard database
kubectl exec -n iot-dashboard deployment/postgres -- \
  pg_dump -U iotuser iotdashboard > backup-iotdashboard.sql

# Restore to shared instance
kubectl exec -i -n shared-data deployment/postgres -- \
  psql -U postgres iotdashboard < backup-iotdashboard.sql
```

### Step 5: Apply Updated Configuration

```bash
# Update iot-dashboard to use shared postgres
kubectl apply -f k8s/kustomization.yaml -n iot-dashboard

# Restart backend to pick up new connection string
kubectl rollout restart deployment/backend -n iot-dashboard
```

### Step 6: Verify

```bash
# Check that backend is connected
kubectl logs -f deployment/backend -n iot-dashboard | grep -i database

# Test direct connection
kubectl port-forward svc/postgres-service -n shared-data 5432:5432
psql -h localhost -U postgres iotdashboard
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ shared-data Namespace (NEW)                              │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                            │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ PostgreSQL 16 (Single Instance)                     │ │   │
│  │  │ - Storage: 20Gi                                     │ │   │
│  │  │ - Max Connections: 200                              │ │   │
│  │  │ - Databases:                                        │ │   │
│  │  │   - iotdashboard                                    │ │   │
│  │  │   - musicnenaghneurofuse                            │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                            │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                             │
│                     │ DNS: postgres-service.shared-data.svc      │
│                     │                                             │
│        ┌────────────┴──────────────┐                             │
│        │                           │                             │
│  ┌─────▼──────────────┐    ┌──────▼──────────────┐              │
│  │ iot-dashboard      │    │ musicnenaghneurofuse│              │
│  │ Namespace          │    │ Namespace           │              │
│  ├────────────────────┤    ├─────────────────────┤              │
│  │ postgres-service   │    │ postgres-service    │              │
│  │ (ExternalName) ◄──┼────┼──────► (ExternalName)              │
│  │                    │    │                     │              │
│  │ Backend (.NET)     │    │ Backend (Node.js)   │              │
│  │ Frontend (React)   │    │ Frontend (React)    │              │
│  └────────────────────┘    └─────────────────────┘              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Monitoring Shared Postgres

```bash
# Check database sizes
kubectl exec -n shared-data deployment/postgres -- \
  psql -U postgres -c \
  "SELECT datname, pg_size_pretty(pg_database_size(datname)) 
   FROM pg_database 
   ORDER BY pg_database_size(datname) DESC;"

# Monitor active connections
kubectl exec -n shared-data deployment/postgres -- \
  psql -U postgres -c \
  "SELECT datname, count(*) as connections 
   FROM pg_stat_activity 
   GROUP BY datname;"

# Check resource usage
kubectl top pod -n shared-data -l app=postgres
```

## Backup Strategy for Shared Instance

```bash
# Full backup of entire postgres instance
kubectl exec -n shared-data deployment/postgres -- \
  pg_dumpall -U postgres | gzip > postgres-full-backup.sql.gz

# Per-database backup
kubectl exec -n shared-data deployment/postgres -- \
  pg_dump -U postgres iotdashboard | gzip > iotdashboard-backup.sql.gz

kubectl exec -n shared-data deployment/postgres -- \
  pg_dump -U postgres musicnenaghneurofuse | gzip > musicnenaghneurofuse-backup.sql.gz
```

## Troubleshooting

### Postgres Pod Not Starting

```bash
# Check logs
kubectl logs -n shared-data deployment/postgres

# Check PVC status
kubectl get pvc -n shared-data

# Check events
kubectl describe pod -n shared-data -l app=postgres
```

### Can't Connect to Database

```bash
# Verify service exists
kubectl get svc -n shared-data postgres-service

# Test DNS resolution
kubectl run -it --rm debug --image=postgres:16-alpine -- \
  nslookup postgres-service.shared-data.svc.cluster.local

# Check network policies
kubectl get networkpolicies -n shared-data
kubectl get networkpolicies -n iot-dashboard
kubectl get networkpolicies -n musicnenaghneurofuse
```

### Database Disk Space Full

```bash
# Check current usage
kubectl exec -n shared-data deployment/postgres -- \
  df -h /var/lib/postgresql/data

# Expand PVC (if supported by storage class)
kubectl patch pvc postgres-pvc -n shared-data \
  -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'

# Or backup and restore with larger volume
```

## Future Enhancements

1. **High Availability Setup**: PostgreSQL with streaming replication
2. **Automated Backups**: WAL archiving to S3/GCS
3. **Connection Pooling**: PgBouncer for improved connection management
4. **Monitoring**: Prometheus metrics and Grafana dashboards
5. **Hot Backups**: pg_basebackup for zero-downtime backups

## References

- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Kubernetes Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
