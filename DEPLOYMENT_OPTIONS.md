# CareSync Healthcare Platform - Deployment Guide

## ✅ Project Status: READY FOR DEPLOYMENT

Your project is **production-ready** with:
- ✅ All 6 features implemented
- ✅ Zero TypeScript errors
- ✅ PostgreSQL database configured
- ✅ WebSocket real-time functionality
- ✅ Full API documentation
- ✅ Doctor Dashboard fix verified
- ✅ All code pushed to GitHub

---

## Deployment Options

### Option 1: Deploy to Render (Recommended - FREE)

**Pros:**
- Free tier available
- Easy GitHub integration
- Automatic deployment on push
- PostgreSQL included
- WebSocket support

**Steps:**

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub
   - Authorize CareSync repository

2. **Deploy Backend (API)**
   ```
   a. Create New Web Service
   b. Select: "Build and deploy from a Git repository"
   c. Connect your GitHub repo
   d. Configure:
      - Name: caresync-api
      - Environment: Node
      - Build Command: npm run build --workspace=apps/api
      - Start Command: npm run start --workspace=apps/api
      - Region: Singapore (closest to India)
   e. Add Environment Variables:
      DATABASE_URL=your_postgres_url
      JWT_SECRET=generate-random-string
      JWT_REFRESH_SECRET=generate-random-string
      NODE_ENV=production
      CORS_ORIGIN=https://your-frontend-url.onrender.com
   f. Create Web Service
   ```

3. **Deploy Database (PostgreSQL)**
   ```
   a. Create New PostgreSQL Database
   b. Name: caresync-db
   c. Region: Singapore
   d. Database: caresync
   e. Copy the connection string
   f. Use in DATABASE_URL above
   ```

4. **Deploy Frontend (Web)**
   ```
   a. Create New Static Site
   b. Select: "Build and deploy from a Git repository"
   c. Build Command: npm run build --workspace=apps/web
   d. Publish Directory: apps/web/dist
   e. Create Static Site
   f. Add environment variable:
      VITE_API_URL=https://caresync-api.onrender.com
      VITE_WS_URL=wss://caresync-api.onrender.com
   ```

5. **Run Migrations**
   ```bash
   # SSH into Render API server
   npm run prisma:migrate -- --name init
   npm run prisma:seed
   ```

**Cost**: Free tier (limited) → $7/month for production

---

### Option 2: Deploy to Vercel + Railway

**Vercel (Frontend)**

1. Go to https://vercel.com
2. Import from GitHub
3. Select `apps/web` as root directory
4. Build Command: `npm run build`
5. Environment Variables:
   ```
   VITE_API_URL=your_api_url
   VITE_WS_URL=your_ws_url
   ```

**Railway (Backend + Database)**

1. Go to https://railway.app
2. New Project → GitHub Repo
3. Add PostgreSQL
4. Deploy with:
   ```
   Start Command: npm run dev --workspace=apps/api
   ```
5. Add env vars

**Cost**: Vercel free, Railway $5+/month

---

### Option 3: Deploy to AWS

**EC2 + RDS Setup**

1. **Create EC2 Instance**
   ```bash
   # Launch Ubuntu instance
   # Connect via SSH
   
   # Install Node.js
   curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Clone repository
   git clone https://github.com/SwethaAnekalla/HealthCare.git
   cd HealthCare
   
   # Install dependencies
   npm install
   npm run build
   
   # Start server
   npm run start --workspace=apps/api &
   ```

2. **Create RDS Database**
   ```bash
   # Create PostgreSQL instance
   # Security Groups: Allow port 5432
   # Get connection string
   ```

3. **Configure Environment**
   ```bash
   # SSH into EC2
   export DATABASE_URL="postgres://user:pass@host:5432/caresync"
   export JWT_SECRET="your-secret-key"
   export NODE_ENV="production"
   export PORT="3000"
   ```

4. **Set Up PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   pm2 start "npm run start --workspace=apps/api"
   pm2 startup
   pm2 save
   ```

5. **Frontend (S3 + CloudFront)**
   ```bash
   # Build
   npm run build --workspace=apps/web
   
   # Upload to S3
   aws s3 sync apps/web/dist s3://your-bucket --delete
   
   # Create CloudFront distribution
   # Point to S3 bucket
   ```

**Cost**: $5-20/month depending on usage

---

### Option 4: Docker + Docker Compose (Self-Hosted)

**Create Dockerfile**

```dockerfile
# apps/api/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build --workspace=apps/api

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=apps/api"]
```

**Update docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: caresync
      POSTGRES_USER: caresync
      POSTGRES_PASSWORD: caresync
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://caresync:caresync@postgres:5432/caresync
      JWT_SECRET: your-secret-key
      NODE_ENV: production
    depends_on:
      - postgres
    command: sh -c "npm run prisma:migrate && npm run start --workspace=apps/api"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "80:5173"
    environment:
      VITE_API_URL: http://localhost:3000
      VITE_WS_URL: ws://localhost:3000
    depends_on:
      - api

volumes:
  postgres_data:
```

**Deploy**

```bash
# On your server
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

**Cost**: Depends on hosting ($5-50/month)

---

### Option 5: Deploy to Heroku (Legacy - Still Works)

**Requirements:**
- Heroku account
- Heroku CLI installed

**Steps:**

```bash
# Login
heroku login

# Create app
heroku create caresync-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET="your-secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku master

# Run migrations
heroku run npm run prisma:migrate

# View logs
heroku logs --tail
```

**Cost**: $7/month minimum (Hobby tier discontinued for free)

---

## Recommended Deployment Path

### For Quick Testing (5 minutes)
✅ **Use Render.com (Free)**
- Easiest setup
- GitHub integration
- Free tier available

### For Production (Reliable)
✅ **Use AWS or DigitalOcean + Docker**
- Full control
- Scalable
- Cost-effective ($5-20/month)

### For Small Business
✅ **Use Vercel (Frontend) + Railway (Backend)**
- Simple to manage
- Good free tiers
- Easy scaling

---

## Pre-Deployment Checklist

- [ ] Update `.env.production` with secure secrets
- [ ] Change JWT secrets (don't use defaults)
- [ ] Set `CORS_ORIGIN` to your domain
- [ ] Configure database backups
- [ ] Set up SSL certificate
- [ ] Enable HTTPS
- [ ] Test all API endpoints
- [ ] Test WebSocket connections
- [ ] Configure error logging
- [ ] Set up monitoring/alerts
- [ ] Document deployment steps
- [ ] Create deployment runbook

---

## Step-by-Step: Deploy to Render (Recommended)

### 1. Prepare GitHub
```bash
# Make sure everything is pushed
git status
git push origin master
```

### 2. Create Render Account
- Go to https://render.com
- Click "Sign Up"
- Choose "GitHub"
- Authorize CareSync repository

### 3. Deploy Database
```
a. Dashboard → New → PostgreSQL
b. Name: caresync-db
c. Database: caresync
d. User: caresync
e. Region: Singapore
f. Create Database
g. Copy DATABASE_URL
```

### 4. Deploy API
```
a. Dashboard → New → Web Service
b. Select: healthcare-platform repo
c. Branch: master
d. Name: caresync-api
e. Environment: Node
f. Build Command: npm run build --workspace=apps/api
g. Start Command: npm --workspace=apps/api start
h. Environment Variables:
   DATABASE_URL = <paste from step 3>
   JWT_SECRET = sk_prod_$(openssl rand -hex 16)
   JWT_REFRESH_SECRET = sk_refresh_$(openssl rand -hex 16)
   NODE_ENV = production
   CORS_ORIGIN = https://<your-frontend-url>
i. Create Web Service
j. Wait for deployment (2-3 minutes)
```

### 5. Run Initial Setup
```
a. In Render dashboard, click on caresync-api
b. Go to "Shell" tab
c. Run:
   npm run prisma:migrate
   npm run prisma:seed
d. Check logs for success
```

### 6. Deploy Frontend
```
a. Dashboard → New → Static Site
b. Select: healthcare-platform repo
c. Branch: master
d. Name: caresync-web
e. Build Command: npm run build --workspace=apps/web
f. Publish Directory: apps/web/dist
g. Environment Variables:
   VITE_API_URL = https://caresync-api.onrender.com
   VITE_WS_URL = wss://caresync-api.onrender.com
h. Create Static Site
i. Wait for deployment (1-2 minutes)
```

### 7. Verify Deployment
```
API: https://caresync-api.onrender.com/health
Web: https://caresync-web.onrender.com
```

**Total Time**: ~10-15 minutes
**Cost**: Free (with limitations) or $14/month for production

---

## Environment Variables Required

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/caresync

# JWT
JWT_SECRET=sk_prod_replace_with_random_string
JWT_REFRESH_SECRET=sk_refresh_replace_with_random_string
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=https://your-frontend-url.com

# Optional: Monitoring
SENTRY_DSN=optional
```

### Frontend (.env)
```env
VITE_API_URL=https://your-api-url.com
VITE_WS_URL=wss://your-api-url.com
```

---

## Post-Deployment

### 1. Test All Features
```
- Register patient account
- Register doctor account
- Search for doctors
- Book appointment
- View on doctor dashboard
- Check real-time updates
- Test refund tracker
- Test support chat
- Test symptom matcher
- Test price match
```

### 2. Monitor Performance
```
- Check API response times
- Monitor database connections
- Track error rates
- Monitor WebSocket connections
```

### 3. Set Up Backups
```
- Database automated backups
- Code repository backups
- Configure disaster recovery
```

### 4. Security Hardening
```
- Enable HTTPS
- Configure firewall
- Set up rate limiting
- Enable CORS properly
- Rotate secrets regularly
```

---

## Common Deployment Issues

### Issue: "Build failed"
```bash
# Solution: Check build logs
npm run build
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

### Issue: "Database migration failed"
```bash
# Solution: Check database URL
DATABASE_URL should be: postgresql://user:password@host:5432/database
# Ensure special characters in password are URL-encoded
```

### Issue: "WebSocket not connecting"
```bash
# Solution: Update CORS_ORIGIN and WS_URL
VITE_WS_URL should match your API domain (wss://)
CORS_ORIGIN should match your frontend domain
```

### Issue: "Port already in use"
```bash
# Solution: Change PORT in environment
PORT=3001  # or different port
```

---

## Scaling Tips

1. **Use CDN for frontend**
   - Cloudflare
   - AWS CloudFront
   - Render CDN

2. **Database optimization**
   - Add indexes
   - Monitor slow queries
   - Use connection pooling

3. **Load balancing**
   - Use multiple API instances
   - Add load balancer
   - Scale horizontally

4. **Caching**
   - Redis for sessions
   - Cache API responses
   - Cache static assets

---

## Deployment Comparison

| Platform | Cost | Ease | Scalability | Control |
|----------|------|------|-------------|---------|
| Render | $$ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Vercel+Railway | $ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| AWS | $$$ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Docker (Self-hosted) | $$ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Heroku | $$$ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## Your Next Steps

1. **Choose deployment platform** (Render recommended)
2. **Gather required secrets** (JWT keys, etc.)
3. **Follow step-by-step guide above**
4. **Test all features**
5. **Monitor and optimize**

**Estimated time to production**: 15-30 minutes

---

**🚀 YOU'RE READY TO DEPLOY!**

Start with Render (easiest) or AWS (most control).

Any questions? Check the troubleshooting section above.
