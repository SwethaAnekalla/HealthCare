# How to Run CareSync Healthcare Platform in VS Code

## Prerequisites
Make sure you have installed:
- ✅ Node.js (v18+)
- ✅ npm or yarn
- ✅ PostgreSQL (or Docker)
- ✅ VS Code
- ✅ Git

Verify with:
```bash
node --version
npm --version
psql --version
```

---

## Step 1: Clone the Repository

Open VS Code and open a new terminal (`Ctrl + ~` or `Ctrl + Shift + ~`)

```bash
# Navigate to where you want the project
cd C:\Users\sama

# Clone the repository
git clone https://github.com/SwethaAnekalla/HealthCare.git

# Navigate into the project
cd HealthCare
```

---

## Step 2: Install Dependencies

```bash
# Install all dependencies for the monorepo
npm install
```

This will install dependencies for:
- Root workspace
- `/packages/shared` - Shared types & schemas
- `/apps/api` - Backend server
- `/apps/web` - Frontend application

**Expected output**: ✅ "added X packages"

---

## Step 3: Set Up Environment Variables

### 3a. Backend Environment (.env)
```bash
# Copy the example file
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and add:
```env
# Database
DATABASE_URL="postgresql://caresync:caresync@localhost:5432/caresync"

# JWT
JWT_SECRET="your-secret-key-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this"
JWT_EXPIRY="24h"
JWT_REFRESH_EXPIRY="7d"

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"

# Logging
LOG_LEVEL="info"
```

### 3b. Frontend Environment (Optional - uses defaults)
Create `apps/web/.env.local` (optional):
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## Step 4: Set Up PostgreSQL Database

### Option A: Using Docker (Recommended)

```bash
# Make sure Docker is running, then:
docker-compose up -d
```

This will:
- Start PostgreSQL container on port 5432
- Create `caresync` database
- Create `caresync` user with password `caresync`

Verify:
```bash
# Check if containers are running
docker ps
```

### Option B: Using Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create database
createdb -U postgres caresync

# Create user
psql -U postgres -c "CREATE USER caresync WITH PASSWORD 'caresync';"

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE caresync TO caresync;"
```

---

## Step 5: Set Up Prisma Database Schema

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (apply database schema)
npm run prisma:migrate

# (Optional) Seed database with sample data
npm run prisma:seed
```

---

## Step 6: Build the Project

```bash
# Build all packages (API, Web, Shared)
npm run build
```

Expected output:
```
✓ API build successful
✓ Web build successful  
✓ Shared build successful
0 errors
```

---

## Step 7: Run the Project

### Option A: Run Both Servers Together (Recommended)

```bash
npm run dev
```

This will start:
- ✅ **API Server** on http://localhost:3000
- ✅ **Web Server** on http://localhost:5173
- ✅ **WebSocket** on ws://localhost:3000

You should see:
```
[0] [INFO] ✅ Database connected
[0] [INFO] 🚀 Server running at http://localhost:3000
[1]   ➜  Local:   http://localhost:5173/
```

### Option B: Run Servers Separately (for debugging)

**Terminal 1 - API Server:**
```bash
npm run dev --workspace=apps/api
```

**Terminal 2 - Web Server:**
```bash
npm run dev --workspace=apps/web
```

---

## Step 8: Verify Everything is Running

Open VS Code's built-in browser or your browser:

1. **Frontend**: http://localhost:5173
2. **API Health Check**: http://localhost:3000/health
3. **WebSocket Status**: Check browser console

---

## Common Commands

### Development
```bash
# Start everything
npm run dev

# Only API
npm run dev --workspace=apps/api

# Only Web
npm run dev --workspace=apps/web

# Only Shared package
npm run dev --workspace=packages/shared
```

### Building
```bash
# Build all
npm run build

# Build specific workspace
npm run build --workspace=apps/api
npm run build --workspace=apps/web
npm run build --workspace=packages/shared
```

### Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Reset database (WARNING: deletes data)
npm run prisma:reset

# Seed database
npm run prisma:seed

# Open Prisma Studio (visual editor)
npm run prisma:studio
```

### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test apps/api/src/__tests__/jobs.test.ts
```

### Linting & Formatting
```bash
# Lint code
npm run lint

# Format code
npm run format
```

---

## Step 9: Test the Application

### 1. Register a Patient Account
```
1. Open http://localhost:5173
2. Click "Sign Up"
3. Choose "Patient" role
4. Fill in details:
   - Email: patient@example.com
   - Password: password123
   - Name: Test Patient
5. Click Register
```

### 2. Search for Doctors
```
1. After login, click "Search Doctors"
2. Browse available doctors
3. Click on a doctor
```

### 3. Book an Appointment
```
1. Select a time slot
2. Fill appointment details
3. Click "Book Appointment"
```

### 4. Login as Doctor to View Appointments
```
1. Open new browser/incognito window
2. Go to http://localhost:5173
3. Login with doctor credentials
4. Go to "Doctor Dashboard"
5. See appointment you just booked!
```

---

## Troubleshooting

### Issue: "Port 3000 already in use"
```bash
# Kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Issue: "Database connection failed"
```bash
# Check if PostgreSQL is running
# Windows:
docker ps  # if using Docker

# Mac/Linux:
psql -U postgres -c "SELECT version();"

# Check DATABASE_URL in .env
# Make sure credentials are correct
```

### Issue: "Port 5173 already in use"
```bash
# Kill the process
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: "ENOENT: no such file or directory"
```bash
# You're in wrong directory
cd C:\Users\sama\HealthCare  # Make sure you're in project root

# Verify:
ls -la  # Should show package.json
```

### Issue: "npm: command not found"
```bash
# Node.js not installed
# Download from: https://nodejs.org
# Or use:
choco install nodejs  # Windows with Chocolatey
brew install node    # Mac with Homebrew
```

### Issue: "Prisma migration failed"
```bash
# Reset migrations (WARNING: deletes data)
npm run prisma:reset

# Or manually create database
createdb -U postgres caresync
```

---

## VS Code Terminal Tips

### Open Multiple Terminals
- Click `+` icon next to terminal tab
- Or press `Ctrl + Shift + ~` multiple times

### Split Terminal
- Right-click terminal tab → "Split Terminal"
- Or use keyboard shortcut shown in menu

### Switch Between Terminals
- Click the terminal name in the dropdown
- Or use `Ctrl + Alt + Right/Left Arrow`

### Copy Terminal Output
- Select text with mouse
- `Ctrl + C` to copy

---

## Project Structure Reference

```
HealthCare/
├── apps/
│   ├── api/                          # Backend server
│   │   ├── src/
│   │   │   ├── modules/             # Feature modules
│   │   │   │   ├── appointments/   # Booking system
│   │   │   │   ├── queue/          # Queue & tokens
│   │   │   │   ├── refunds/        # Refund tracker
│   │   │   │   ├── support/        # Support chat
│   │   │   │   └── ...
│   │   │   ├── realtime/           # WebSocket events
│   │   │   └── jobs/               # Background tasks
│   │   ├── prisma/
│   │   │   └── schema.prisma       # Database schema
│   │   └── package.json
│   │
│   └── web/                          # Frontend React app
│       ├── src/
│       │   ├── pages/               # Route pages
│       │   ├── components/          # Reusable components
│       │   ├── features/            # Feature components
│       │   └── hooks/               # Custom React hooks
│       └── package.json
│
├── packages/
│   └── shared/                      # Shared types & schemas
│       └── src/
│           ├── enums.ts
│           ├── types.ts
│           └── schemas.ts
│
├── package.json                     # Root workspace config
└── docker-compose.yml               # Database setup
```

---

## Next Steps After Running

1. ✅ Explore the API documentation at `http://localhost:3000/health`
2. ✅ Test all 6 features on the frontend
3. ✅ Check browser DevTools console for WebSocket events
4. ✅ Review code in VS Code
5. ✅ Make changes and see live reload (both servers support hot reload)

---

## Need Help?

- Check `README.md` for project overview
- See `HOW_TO_USE.md` for user workflows
- Read `API_DOCUMENTATION.md` for backend endpoints
- Review `DOCTOR_DASHBOARD_FIX_SUMMARY.md` for dashboard fix details

---

**You're all set! The platform is ready to use!** 🎉

Happy coding! 💻
