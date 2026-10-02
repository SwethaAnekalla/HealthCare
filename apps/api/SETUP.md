# Backend Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional)

## Database Setup

### 1. Start Docker services

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis.

### 2. Create .env file

```bash
cd apps/api
cp .env.example .env
# Edit .env with your database URL if needed
```

### 3. Run migrations

```bash
# Create migration files
npx prisma migrate dev --name init

# Or deploy existing migrations
npx prisma migrate deploy
```

### 4. Seed demo data

```bash
npx prisma db seed
```

This creates:
- 5 doctors across different specialties
- 3 patients
- 3 clinics
- 30+ symptoms with specialty mappings
- Admin, support agent, and demo users
- Sample appointments for testing

### 5. Access the database

```bash
# Open Prisma Studio to browse data
npx prisma studio
```

Studio runs at `http://localhost:5555`

## Database Schema

The schema includes 60+ tables covering:

- **Auth & Users**: User accounts, roles (Patient, Doctor, Admin, etc.)
- **Appointments**: Booking, status tracking, cancellations
- **Doctor Status**: Real-time status updates (Unique Feature 1)
- **Queue**: Live queue tracking (Unique Feature 6)
- **Refunds**: Refund lifecycle and tracking (Unique Feature 2)
- **Support**: Chat conversations and tickets (Unique Feature 3)
- **Pricing**: Fee management and price disputes (Unique Feature 5)
- **Symptoms**: Symptom-to-specialty mapping (Unique Feature 4)
- **Clinic Management**: Clinic and staff management
- **Medical Records**: Prescriptions, reviews, health records
- **Analytics**: Audit logs, notifications, analytics

## Demo Accounts

After seeding, these accounts are available (password: `password123`):

### Admin
```
Email: admin@caresync.com
```

### Doctors
```
Dr. Rajesh Sharma (Cardiologist)
Email: dr.sharma@caresync.com

Dr. Neha Patel (Orthopedist)
Email: dr.patel@caresync.com

Dr. Anil Gupta (General Physician)
Email: dr.gupta@caresync.com

Dr. Sonia Verma (Dermatologist)
Email: dr.verma@caresync.com

Dr. Vikram Singh (Neurologist)
Email: dr.singh@caresync.com
```

### Patients
```
Email: patient1@caresync.com
Email: patient2@caresync.com
Email: patient3@caresync.com
```

### Support Agent
```
Email: agent@caresync.com
```

## Development Workflow

### Run the API server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

API health check: `http://localhost:3000/api/health`

### View database changes

```bash
# After making changes to schema.prisma
npx prisma migrate dev --name <description>
```

### Reset database

```bash
# WARNING: Deletes all data
npx prisma migrate reset
```

This runs all migrations from scratch and re-seeds the database.

## Environment Variables

Key variables in `.env`:

```
DATABASE_URL=postgresql://...
API_PORT=3000
JWT_SECRET=your_secret_key
PAYMENT_PROVIDER=mock  # or razorpay
EMAIL_PROVIDER=log     # or nodemailer
SYMPTOM_MATCHER_PROVIDER=deterministic  # or anthropic, openai
```

## Troubleshooting

### "Can't reach database"

1. Ensure Docker containers are running: `docker-compose up -d`
2. Check PostgreSQL is accessible: `psql postgresql://caresync:caresync_dev_password@localhost:5432/caresync`
3. Verify DATABASE_URL in `.env`

### "Prisma client not generated"

```bash
npx prisma generate
```

### Migration conflicts

```bash
# View migration status
npx prisma migrate status

# Resolve conflicts manually, then mark as applied
npx prisma migrate resolve --applied <migration_name>
```

### Clear and restart

```bash
# Stop Docker
docker-compose down

# Remove volume
docker-compose down -v

# Restart
docker-compose up -d

# Reset database
npx prisma migrate reset
```

## Next Steps

After database is seeded:
1. Start the API server: `npm run dev`
2. Go to Phase 3: Implement backend APIs
3. Create authentication endpoints
4. Build core appointment logic
5. Implement unique features
