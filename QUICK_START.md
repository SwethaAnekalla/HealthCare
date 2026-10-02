# CareSync - Quick Start Guide

## 🚀 Start CareSync in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

This installs all root, backend, and frontend dependencies.

### Step 2: Start Backend API
```bash
npm run dev:api
```
This starts the Express backend server on **http://localhost:3000**

### Step 3: Start Frontend (in new terminal)
```bash
npm run dev:web
```
This starts the Vite React dev server on **http://localhost:5173**

---

## ✅ You're Ready!

Open your browser to: **http://localhost:5173**

### Demo Accounts to Test

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@caresync.com | password123 |
| Doctor | dr.sharma@caresync.com | password123 |
| Admin | admin@caresync.com | password123 |
| Support Agent | agent@caresync.com | password123 |
| Clinic Staff | staff@caresync.com | password123 |

---

## 🎯 Test Each Feature

### 1. Live Doctor Status (5 min)
1. Log in as **Dr. Sharma** (doctor@caresync.com)
2. Go to Doctor Dashboard
3. Change status to "RUNNING_LATE"
4. Log in as **Patient**
5. Go to Search → See status updated in real-time

### 2. Queue Tracking (5 min)
1. Log in as **Clinic Staff** (staff@caresync.com)
2. Check in a patient
3. Log in as **Patient**
4. Go to Queue Tracker
5. See live position and ETA

### 3. Refund Processing (5 min)
1. Log in as **Admin** (admin@caresync.com)
2. Go to Admin Dashboard → Refunds tab
3. Approve a refund
4. Log in as **Patient**
5. See wallet credit within 2 minutes

### 4. Symptom Checker (2 min)
1. Go to Home Page (no login needed)
2. Find "Symptom Checker" section
3. Enter: "Chest pain, shortness of breath"
4. See emergency alert and specialist recommendations

### 5. Price Disputes (5 min)
1. Log in as **Admin**
2. Go to Admin Dashboard → Disputes tab
3. Review and approve a dispute
4. Auto-refund is processed

### 6. Support Chat (5 min)
1. Log in as **Patient**
2. Click chat icon
3. Type a message
4. Log in as **Support Agent** (agent@caresync.com)
5. Go to Agent Workspace and respond

---

## 📊 Project Structure

```
healthcare-platform/
├── apps/
│   ├── api/          # Express backend (port 3000)
│   └── web/          # React frontend (port 5173)
├── packages/
│   └── shared/       # Shared types
└── docs/             # Documentation
```

---

## 🔧 Common Commands

```bash
# Install all dependencies
npm install

# Start both servers (requires concurrently)
npm run dev

# Start just backend
npm run dev:api

# Start just frontend
npm run dev:web

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

---

## 🗄️ Database Notes

This demo uses **mock data** for testing. To use real PostgreSQL:

1. Install PostgreSQL locally or use Docker
2. Update `apps/api/.env` with your database URL
3. Run: `npx prisma migrate dev`
4. Run: `npx prisma db seed`

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Web UI |
| Backend API | http://localhost:3000 | REST API |
| WebSocket | ws://localhost:3000 | Real-time updates |

---

## 📝 Features Overview

### ✨ All 6 Unique Features Included

1. **Live Doctor Status** - Real-time doctor status updates
2. **Instant Refunds** - Auto-process refunds with wallet credit
3. **Human-Escalation Chat** - Support tickets with agent escalation
4. **AI Symptom Matching** - Symptom checker with specialist matching
5. **Price Match Guarantee** - Price dispute resolution
6. **Live Queue Tracker** - Real-time queue position and ETA

---

## ⚠️ Troubleshooting

### "Command not found" errors
```bash
# Install dependencies globally
npm install -g vite concurrently tsx

# Then try again
npm install
npm run dev
```

### Port already in use
```bash
# Change frontend port
npm run dev:web -- --port 3001

# Or kill the process using the port
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

### Database errors
- Demo mode runs without database
- Real features work but with mock data
- Install PostgreSQL if you want persistent data

---

## 📚 Full Documentation

- **API_DOCUMENTATION.md** - All 50+ endpoints
- **DEPLOYMENT_GUIDE.md** - Production deployment
- **ACCESSIBILITY_GUIDE.md** - Accessibility features
- **PERFORMANCE_GUIDE.md** - Performance optimization
- **PROJECT_COMPLETION_SUMMARY.md** - Complete overview

---

## 🎉 Ready to Code!

You now have CareSync running locally with all 6 features ready to test.

**Next Steps:**
1. Open http://localhost:5173 in your browser
2. Log in with a demo account
3. Test the features
4. Explore the code in `apps/api` and `apps/web`

Enjoy! 🚀
