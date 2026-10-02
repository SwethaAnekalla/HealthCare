# ✅ Quick Deployment Checklist

## Pre-Deployment (5 minutes)

- [ ] All code committed to GitHub
- [ ] Tested locally (`npm run dev` works)
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] Database schema created (`npm run prisma:migrate`)
- [ ] Sample data seeded (`npm run prisma:seed`)

```bash
# Verify everything works
npm run build
npm run dev  # Test for 1 minute
```

---

## Choose Your Platform

### ⭐ RECOMMENDED: Render.com (Easiest)

**Why?**
- Free tier available
- GitHub integration (auto-deploy)
- PostgreSQL included
- WebSocket support
- Takes ~15 minutes total

---

## Render Deployment (Step-by-Step)

### Step 1: Create Accounts (2 min)

```
1. Go to render.com
2. Sign up with GitHub
3. Authorize your repository
```

### Step 2: Create Database (2 min)

```
Dashboard → New → PostgreSQL

Fill:
  Name: caresync-db
  Database: caresync
  User: caresync
  Password: (auto-generated)
  Region: Singapore (closest to India)

Click "Create Database"

SAVE: DATABASE_URL (shown after creation)
```

### Step 3: Deploy API (4 min)

```
Dashboard → New → Web Service

Select: Your GitHub repo
Branch: master
Root Directory: apps/api

Fill:
  Name: caresync-api
  Environment: Node
  Build Command: npm run build --workspace=apps/api
  Start Command: npm --workspace=apps/api start
  Region: Singapore

Add Environment Variables:
  DATABASE_URL = [paste from Step 2]
  JWT_SECRET = sk_prod_abc123xyz789_change_this
  JWT_REFRESH_SECRET = sk_refresh_def456uvw012_change_this
  NODE_ENV = production
  CORS_ORIGIN = https://caresync-web.onrender.com
  PORT = 3000

Click "Create Web Service"

WAIT: Deployment completes (2-3 min)
```

### Step 4: Initialize Database (1 min)

```
After API deploys:

1. Click on caresync-api
2. Go to "Shell" tab
3. Run commands:

npm run prisma:migrate
npm run prisma:seed

4. Wait for "🎉 Seeding completed successfully!"
```

### Step 5: Deploy Frontend (3 min)

```
Dashboard → New → Static Site

Select: Your GitHub repo
Branch: master
Root Directory: apps/web

Fill:
  Name: caresync-web
  Build Command: npm run build --workspace=apps/web
  Publish Directory: apps/web/dist
  Region: Singapore

Add Environment Variables:
  VITE_API_URL = https://caresync-api.onrender.com
  VITE_WS_URL = wss://caresync-api.onrender.com

Click "Create Static Site"

WAIT: Deployment completes (1-2 min)
```

---

## Verify Deployment (5 min)

### Test API
```
Open: https://caresync-api.onrender.com/health

Expected Response:
{
  "success": true,
  "data": {
    "status": "running",
    "timestamp": "2025-10-01T..."
  }
}
```

### Test Frontend
```
Open: https://caresync-web.onrender.com

Expected: Homepage loads, no errors in console
```

### Test Full Flow
```
1. Click "Sign Up"
2. Register as PATIENT:
   Email: test@example.com
   Password: Test123@456
   Name: Test Patient
   Phone: 9876543210
   Role: PATIENT

3. After signup:
   - Should redirect to home page
   - Should show search for doctors
   - No console errors

4. Login as DOCTOR (if registered):
   Email: dr.sharma@caresync.com
   Password: password123
   
5. View Doctor Dashboard:
   - Should show today's appointments
   - Should auto-refresh
   - Should show real data (not mock)
```

---

## URLs After Deployment

| Service | URL |
|---------|-----|
| **API Server** | https://caresync-api.onrender.com |
| **Health Check** | https://caresync-api.onrender.com/health |
| **WebSocket** | wss://caresync-api.onrender.com |
| **Frontend App** | https://caresync-web.onrender.com |

---

## Test Credentials

### Doctor (Pre-seeded)
```
Email: dr.sharma@caresync.com
Password: password123
Specialty: Cardiology
Clinic: Care Medical Clinic
```

### Patient (Pre-seeded)
```
Email: patient1@caresync.com
Password: password123
Name: Amit Kumar
```

### Admin
```
Email: admin@caresync.com
Password: password123
```

---

## Common Issues & Fixes

### Issue: "Database connection failed"
```
Fix: 
1. Check DATABASE_URL in environment variables
2. Ensure PostgreSQL is created and running
3. Verify credentials are correct
4. Test connection in Render shell
```

### Issue: "Build failed"
```
Fix:
1. Check build logs in Render dashboard
2. Ensure npm run build works locally
3. Clear node_modules and reinstall:
   npm install
   npm run build
```

### Issue: "Page shows 'Cannot GET /'"
```
Fix:
1. Check that Frontend points to correct API URL
2. Verify VITE_API_URL environment variable
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try in incognito window
```

### Issue: "WebSocket not connecting"
```
Fix:
1. Verify VITE_WS_URL = wss://... (not ws://)
2. Check CORS_ORIGIN matches frontend domain
3. Ensure API is running and accessible
4. Check browser console for errors
```

---

## After Deployment

### ✅ Success: Your app is LIVE!

### Next Steps:

1. **Share with others**
   ```
   Frontend URL: https://caresync-web.onrender.com
   ```

2. **Share credentials**
   ```
   Doctor: dr.sharma@caresync.com / password123
   Patient: patient1@caresync.com / password123
   ```

3. **Monitor**
   - Check Render dashboard regularly
   - Monitor for errors
   - Track performance

4. **Optimize (Optional)**
   - Add custom domain
   - Set up SSL certificate
   - Configure backups
   - Add monitoring/alerts

---

## Estimated Timeline

| Step | Time |
|------|------|
| Create accounts | 2 min |
| Create database | 2 min |
| Deploy API | 4 min |
| Initialize DB | 1 min |
| Deploy Frontend | 3 min |
| Verify (testing) | 5 min |
| **TOTAL** | **~17 minutes** |

---

## Important Notes

⚠️ **Free Tier Limits:**
- 0.5GB RAM
- 750 hours/month uptime
- Slow spins down after inactivity

✅ **For Production:**
- Upgrade to Starter tier ($7-25/month)
- Ensures always-on
- Better performance
- Dedicated resources

💾 **Database Backups:**
- Render auto-backups PostgreSQL
- 7-day retention on free tier
- Longer on paid plans

🔐 **Security:**
- Update JWT secrets (change from defaults)
- Use strong passwords
- Enable 2FA on Render account
- Keep secrets out of git

---

## Need Help?

**If something fails:**

1. Check error logs in Render dashboard
2. SSH into instance and run commands
3. Check GitHub Actions for build issues
4. Review environment variables
5. Test locally first: `npm run dev`

---

## Final Checklist Before Going Live

- [ ] API is deployed and health check passes
- [ ] Frontend is deployed and loads
- [ ] Database is initialized with seed data
- [ ] Can register new patient account
- [ ] Can login as doctor
- [ ] Can view appointments on doctor dashboard
- [ ] WebSocket is working (real-time updates)
- [ ] No console errors in browser
- [ ] All 6 features are accessible
- [ ] Shared URLs with stakeholders

---

## 🚀 YOU'RE READY TO DEPLOY!

**Your healthcare platform is production-ready.**

**Next Action:** Follow the Render deployment steps above (15-20 minutes total)

**Questions?** Check DEPLOYMENT_OPTIONS.md for more details

---

**Good luck! Your CareSync platform will be live soon! 🎉**
