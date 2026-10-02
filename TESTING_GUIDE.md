# CareSync Healthcare Platform - Complete Testing Guide

## ✅ System Status Summary

### Backend (API)
- **Server**: Running on `http://localhost:3000` ✅
- **Database**: PostgreSQL connected ✅
- **Status Checks**: Health endpoint responds ✅
- **Authentication**: Registration & Login working ✅
- **Background Jobs**: 6 jobs scheduled and running ✅

### Frontend (Web)
- **Dev Server**: Running on `http://localhost:5173` ✅
- **TypeScript**: All errors resolved ✅
- **Routes**: All pages configured ✅
- **Components**: Rendering correctly ✅

### Database
- **PostgreSQL**: Running in Docker ✅
- **Database**: `caresync` created ✅
- **Tables**: All 40+ tables migrated ✅
- **Data**: Initial migration applied ✅

---

## 🧪 Complete Testing Workflow

### Step 1: Signup/Registration

#### Test Case 1.1: Patient Registration
1. Open: **http://localhost:5173/signup**
2. Select: **"I am a: Patient"**
3. Fill form:
   - Full Name: `John Doe`
   - Email: `john.doe@example.com`
   - Phone: `+12025551234`
   - Password: `SecurePass123`
4. Click: **"Sign up"**
5. **Expected Result**: Redirected to home page, logged in

#### Test Case 1.2: Doctor Registration
1. Open: **http://localhost:5173/signup**
2. Select: **"I am a: Doctor"**
3. Fill form:
   - Full Name: `Dr. Sarah Smith`
   - Email: `dr.sarah@example.com`
   - Phone: `+12025559876`
   - Password: `DoctorPass123`
4. Click: **"Sign up"**
5. **Expected Result**: Redirected to home page with Doctor role

#### Test Case 1.3: Validation Tests
- **Empty Fields**: Try submitting with empty fields → Error message appears
- **Invalid Email**: Enter `invalidemail` → Error message "Invalid email"
- **Short Password**: Enter `abc123` → Error message "Minimum 8 characters"
- **Invalid Phone**: Enter `123` → Error message about phone format
- **Duplicate Email**: Use existing email → Error "Email already registered"
- **Duplicate Phone**: Use existing phone → Error "Phone already registered"

---

### Step 2: Login

#### Test Case 2.1: Valid Login
1. Open: **http://localhost:5173/login**
2. Enter Email: (one you registered)
3. Enter Password: (correct password)
4. Click: **"Sign in"**
5. **Expected Result**: 
   - Logged in successfully
   - Redirected to home page
   - Navbar shows your name

#### Test Case 2.2: Invalid Login
1. Open: **http://localhost:5173/login**
2. Enter Email: `wrong@example.com`
3. Enter Password: `wrongpassword`
4. Click: **"Sign in"**
5. **Expected Result**: Error message "Invalid email or password"

#### Test Case 2.3: Demo Credentials (if seeded)
- Email: `patient1@caresync.com`
- Password: `password123`
- **Note**: These only work if seed script was run

---

### Step 3: Patient Features

#### Test Case 3.1: Patient Dashboard
1. Login as Patient
2. Click: **"Search Doctors"** (or navigate to `/search`)
3. **Expected Result**: Page loads with:
   - Doctor search form
   - Filter options (specialty, location, fees)
   - List of available doctors

#### Test Case 3.2: Doctor Search & Filter
1. On Search page
2. Use filters to find doctors
3. **Expected Result**: Results update based on filters

#### Test Case 3.3: View Doctor Profile
1. Click on any doctor in search results
2. **Expected Result**: Shows:
   - Doctor name and specialty
   - Experience and qualifications
   - Patient reviews
   - Available appointment slots
   - Consultation fees

#### Test Case 3.4: Book Appointment
1. On doctor profile
2. Select a time slot
3. Choose consultation mode (Online/In-person)
4. Enter reason for visit
5. Click: **"Book Appointment"**
6. **Expected Result**: 
   - Appointment confirmed
   - Appointment appears in "My Appointments"
   - Confirmation message displayed

#### Test Case 3.5: View My Appointments
1. Go to patient dashboard
2. Click: **"My Appointments"**
3. **Expected Result**: Shows:
   - Upcoming appointments
   - Past appointments
   - Appointment status

#### Test Case 3.6: Queue Tracker (In-Person Appointments)
1. Navigate to: **http://localhost:5173/queue-tracker**
2. **Expected Result**: Shows:
   - Current queue position
   - Estimated wait time
   - Queue status
   - Token number

---

### Step 4: Doctor Features

#### Test Case 4.1: Doctor Dashboard
1. Login as Doctor
2. Navigate to: **http://localhost:5173/doctor/dashboard**
3. **Expected Result**: Shows:
   - Today's appointments
   - Upcoming appointments
   - Doctor profile
   - Earnings summary

#### Test Case 4.2: Manage Availability
1. On doctor dashboard
2. Click: **"Manage Hours"** or **"Set Availability"**
3. Set working hours and add slots
4. **Expected Result**: Slots saved and visible to patients

#### Test Case 4.3: Update Status
1. On doctor dashboard
2. Click: **"Update Status"**
3. Options:
   - On Time
   - Running Late (specify delay)
   - On Leave (specify dates)
4. **Expected Result**: Status updates and patients see ETA changes

#### Test Case 4.4: View Appointments
1. On doctor dashboard
2. Click: **"Appointments"** or **"Today's Patients"**
3. **Expected Result**: Shows all scheduled appointments with:
   - Patient name
   - Appointment time
   - Reason for visit
   - Consultation mode

#### Test Case 4.5: Conduct Online Consultation
1. On appointment
2. If online appointment, click: **"Start Consultation"**
3. **Expected Result**: Video call interface opens

---

### Step 5: Authentication & Authorization

#### Test Case 5.1: Protected Routes
1. Open: **http://localhost:5173/search** (Patient route) - without login
2. **Expected Result**: Redirected to `/login`

3. Login as Doctor
4. Try to access: **http://localhost:5173/search** (Patient route)
5. **Expected Result**: Redirected to home page (access denied)

#### Test Case 5.2: Token Expiry
1. Login successfully
2. Check browser DevTools → Application → Cookies
3. Delete the `accessToken` cookie manually
4. Refresh page
5. **Expected Result**: Redirected to `/login`

---

## 🔍 API Endpoint Testing

### Health Check
```
GET http://localhost:3000/health
Expected: { "status": "ok", "timestamp": "..." }
```

### Registration
```
POST http://localhost:3000/api/auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phone": "+12025551234",
  "role": "PATIENT"
}
Expected: { "success": true, "data": { "id": "...", "email": "..." } }
```

### Login
```
POST http://localhost:3000/api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
Expected: { "success": true, "data": { "user": {...}, "accessToken": "..." } }
```

---

## 🐛 Troubleshooting

### Issue: Signup page doesn't load
- **Solution**: Check that `/signup` route is added to `App.tsx`
- **Check**: Open browser DevTools Console for errors
- **Fix**: Refresh page (Ctrl+F5 for hard refresh)

### Issue: Registration fails with 500 error
- **Solution**: Check API server logs for database errors
- **Check**: Verify database is running `docker ps | findstr caresync`
- **Fix**: Check `/api` error response for specific error message

### Issue: Login fails but registration works
- **Solution**: Check that password matches what you entered
- **Check**: Ensure email is spelled correctly (case-insensitive)
- **Fix**: Try resetting by creating a new account with different email

### Issue: Can't book appointment
- **Solution**: Ensure you're logged in as PATIENT
- **Check**: Verify doctor has available slots
- **Fix**: Create/update doctor availability first

### Issue: WebSocket not connecting
- **Solution**: This is non-critical, real-time features just won't update instantly
- **Check**: Open browser DevTools → Network → WS tab
- **Fix**: Can be ignored for now

### Issue: Appointment doesn't appear in list
- **Solution**: Refresh the page
- **Check**: Verify doctor accepted the appointment
- **Fix**: Check API logs for create appointment errors

---

## 📊 Current Data in System

### Known Registered Users (from API logs)
1. **Email**: `swethaaanekalla@gmail.com` - **Role**: PATIENT ✅
2. **Email**: `sandhyaanekalla@gmail.com` - **Role**: DOCTOR ✅

### Test Credentials (if you registered yourself)
- Use your own email/password from signup

---

## ✅ Feature Checklist

### Authentication
- [ ] Patient signup works
- [ ] Doctor signup works
- [ ] Login validation works
- [ ] Email/phone duplication checks work
- [ ] Password validation works
- [ ] Logout works
- [ ] Protected routes redirect to login
- [ ] Role-based access control works

### Patient Features
- [ ] Search doctors works
- [ ] Filter doctors by specialty works
- [ ] View doctor profile works
- [ ] Book appointment works
- [ ] View my appointments works
- [ ] Cancel appointment works (if implemented)
- [ ] View queue position works

### Doctor Features
- [ ] Doctor dashboard loads
- [ ] Set availability works
- [ ] Update status works
- [ ] View appointments works
- [ ] Start consultation works (for online)
- [ ] View earnings works

### Database
- [ ] User table has records
- [ ] Appointment table stores appointments
- [ ] Prisma queries working
- [ ] No database connection errors

---

## 🚀 Next Steps if Everything Works

1. **Seed demo data**: Run seed script to populate demo doctors/patients
2. **Test payment flow**: If payment module exists
3. **Test support features**: Chat, support tickets, etc.
4. **Load testing**: Test with multiple concurrent users
5. **Mobile testing**: Test on mobile devices

---

## 📞 Support

If something isn't working:
1. **Check browser console**: DevTools → Console for React errors
2. **Check API server logs**: Look for [ERROR] messages
3. **Check network tab**: DevTools → Network for failed requests
4. **Restart servers**: Kill and restart `npm run dev`
5. **Clear cache**: Browser → Settings → Clear browsing data → Cookies

---

**Last Updated**: 2026-10-02
**Status**: All Core Systems Operational ✅
