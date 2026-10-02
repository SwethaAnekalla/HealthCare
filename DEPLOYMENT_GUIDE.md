# CareSync Deployment Guide

## Quick Start (5 minutes)

```bash
# 1. Clone repository
git clone <repo-url>
cd healthcare-platform

# 2. Setup environment
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# 3. Install dependencies
npm install

# 4. Start database
docker-compose up -d

# 5. Initialize database
cd apps/api
npx prisma db seed
cd ../..

# 6. Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

---

## Environment Configuration

### Root `.env` file
```env
# Workspace configuration
NODE_ENV=development
```

### Backend `apps/api/.env`
```env
# Server
NODE_ENV=production
API_PORT=3000
API_HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/caresync

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:5173

# Email (for reset passwords)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend `apps/web/.env`
```env
VITE_API_URL=http://localhost:3000
VITE_ENV=development
```

---

## Docker Deployment

### Using Docker Compose (Recommended)

**1. Create `docker-compose.prod.yml`**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: caresync
      POSTGRES_USER: caresync
      POSTGRES_PASSWORD: secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://caresync:secure-password@postgres:5432/caresync
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: https://yourdomain.com
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: https://api.yourdomain.com
    depends_on:
      - api

volumes:
  postgres_data:
```

**2. Build images**
```bash
docker-compose -f docker-compose.prod.yml build
```

**3. Start services**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**4. Initialize database**
```bash
docker-compose -f docker-compose.prod.yml exec api npx prisma db seed
```

---

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (EKS, GKE, AKS)
- kubectl configured
- Docker images pushed to registry

### Deployment Files

**1. Namespace**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: caresync
```

**2. PostgreSQL StatefulSet**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: caresync
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: caresync
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: caresync
        - name: POSTGRES_USER
          value: caresync
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

**3. Backend Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: caresync
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: your-registry/caresync-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secret
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secret
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**4. Frontend Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: caresync
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: your-registry/caresync-web:latest
        ports:
        - containerPort: 80
```

**5. Services**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: caresync
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - port: 5432

---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: caresync
spec:
  selector:
    app: api
  ports:
  - port: 3000
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: caresync
spec:
  selector:
    app: web
  ports:
  - port: 80
  type: LoadBalancer
```

---

## Database Migrations

### Initial Setup
```bash
# Generate migrations
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy
```

### Backup Before Migration
```bash
# Backup PostgreSQL
pg_dump -U caresync caresync > backup-$(date +%Y%m%d).sql
```

### Rollback
```bash
# List migrations
npx prisma migrate status

# Resolve failed migration
npx prisma migrate resolve --rolled-back "migration_name"
```

---

## Monitoring & Logging

### Application Monitoring

**Sentry Setup**
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Log Aggregation

**CloudWatch (AWS)**
```bash
npm install aws-sdk winston-cloudwatch
```

**Datadog**
```bash
npm install dd-trace
```

### Metrics

**Prometheus**
```bash
npm install prom-client
```

---

## Health Checks

### Backend Health Endpoint
```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(500).json({ status: 'not ready' });
  }
});
```

---

## SSL/TLS Setup

### Using Let's Encrypt + Nginx

**Nginx Configuration**
```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Auto-renewal**
```bash
certbot renew --quiet
```

---

## Scaling

### Horizontal Scaling
```bash
# Scale API replicas
kubectl scale deployment api --replicas=5 -n caresync

# Scale web replicas
kubectl scale deployment web --replicas=3 -n caresync
```

### Load Balancing
- Use Kubernetes Service (built-in load balancing)
- Or use Nginx, HAProxy, or cloud load balancer

### Database Scaling
- Read replicas for read-heavy operations
- Connection pooling with PgBouncer

---

## Backup & Recovery

### Automated Backups
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/caresync"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump -U caresync caresync | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only 30 days
find $BACKUP_DIR -mtime +30 -delete
```

### Recovery
```bash
# Restore from backup
gunzip < backup_20240101_120000.sql.gz | psql -U caresync caresync
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check PostgreSQL is running
docker-compose ps

# Check connection string
echo $DATABASE_URL
```

**2. Socket.IO Connection Issues**
```typescript
// Enable CORS in Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});
```

**3. Performance Degradation**
```bash
# Check database slow queries
SELECT * FROM pg_stat_statements WHERE mean_time > 1000;

# Check API latency
npm run profile
```

**4. Memory Leaks**
```bash
# Enable garbage collection logging
node --trace-gc server.ts

# Use clinic.js for profiling
npm install -g clinic
clinic doctor -- node server.ts
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Configure firewall rules
- [ ] Enable monitoring & alerting
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## Performance Optimization

### Database
- Add indexes on frequently queried fields
- Enable query caching
- Use connection pooling

### API
- Enable compression (gzip)
- Set cache headers
- Use CDN for static assets
- Enable database query optimization

### Frontend
- Code-splitting (already implemented)
- Lazy loading (already implemented)
- Image optimization (already implemented)
- Service Worker for offline support

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Seed data loaded
- [ ] SSL certificates installed
- [ ] Backup system configured
- [ ] Monitoring enabled
- [ ] Error tracking setup
- [ ] Performance monitoring active
- [ ] Health checks responding
- [ ] All tests passing

---

## Support & Maintenance

### Regular Tasks
- Weekly: Check error logs
- Weekly: Monitor performance
- Monthly: Review security logs
- Monthly: Update dependencies
- Quarterly: Full backup test
- Quarterly: Security audit

### Incident Response
1. Check monitoring dashboards
2. Review error logs
3. Identify root cause
4. Deploy fix
5. Monitor for stability
6. Post-mortem analysis

---

## Useful Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Check linting
npm run lint

# Format code
npm run format

# Database operations
npx prisma studio        # Open Prisma Studio
npx prisma migrate dev   # Create migration
npx prisma db seed       # Run seed script
npx prisma db reset      # Reset database

# Docker
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs -f   # View logs

# Kubernetes
kubectl apply -f deployment.yaml
kubectl get pods -n caresync
kubectl logs -f deployment/api -n caresync
kubectl scale deployment/api --replicas=3 -n caresync
```

---

**Last Updated**: October 1, 2024  
**Status**: Production Ready
