@echo off
REM Initialize database for CareSync on Windows

echo 🚀 Initializing CareSync Database...

cd apps\api

REM Check if migrations exist, if not create them
if not exist "prisma\migrations\init" (
  echo 📝 Creating initial migration...
  call npx prisma migrate dev --name init --skip-generate
) else (
  echo 📝 Applying migrations...
  call npx prisma migrate deploy
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npx prisma generate

REM Seed database
echo 🌱 Seeding database with demo data...
call npx prisma db seed

echo.
echo ✅ Database initialization complete!
echo.
echo 📊 Demo Accounts:
echo   Admin: admin@caresync.com
echo   Doctor: dr.sharma@caresync.com
echo   Patient: patient1@caresync.com
echo   Support Agent: agent@caresync.com
echo.
echo 🔑 Password: password123
echo.
echo 💡 View database: npx prisma studio

cd ..\..
