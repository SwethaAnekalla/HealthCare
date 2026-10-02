#!/bin/bash

# Initialize database for CareSync
# This script sets up the database, runs migrations, and seeds demo data

set -e

echo "🚀 Initializing CareSync Database..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
cd apps/api

# Check if migrations exist, if not create them
if [ ! -d "prisma/migrations/init" ]; then
  echo "📝 Creating initial migration..."
  npx prisma migrate dev --name init --skip-generate
else
  echo "📝 Applying migrations..."
  npx prisma migrate deploy
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database
echo "🌱 Seeding database with demo data..."
npx prisma db seed

echo "✅ Database initialization complete!"
echo ""
echo "📊 Demo Accounts:"
echo "  Admin: admin@caresync.com"
echo "  Doctor: dr.sharma@caresync.com"
echo "  Patient: patient1@caresync.com"
echo "  Support Agent: agent@caresync.com"
echo ""
echo "🔑 Password: password123"
echo ""
echo "💡 View database: npx prisma studio"
