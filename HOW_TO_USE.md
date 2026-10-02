# CareSync Healthcare Platform - How to Use

## Quick Start

### 1. **OPEN THE WEBSITE**
Go to: **http://localhost:5173**

---

## USER WORKFLOWS

### 👤 PATIENT WORKFLOW

#### **Step 1: Sign Up as Patient**
1. Click **"Sign Up"** on home page
2. Select **"I am a: Patient"**
3. Fill form:
   - **Full Name**: Your name
   - **Email**: Your email
   - **Phone**: Phone number (format: +1...)
   - **Password**: At least 8 characters
4. Click **"Sign up"**
5. ✅ Auto-login → Redirected to home page

#### **Step 2: Search for Doctors**
1. Click **"Search Doctors"** from home page
2. Or go to: **http://localhost:5173/search**
3. You'll see:
   - **Search doctors** by name or specialty
   - **Filter options**: Specialty, experience, rating
   - **Doctor list** with cards showing:
     - Doctor name & specialty
     - Experience
     - Consultation fee (₹500, ₹1000, etc.)
     - Status (AVAILABLE, RUNNING_LATE, etc.)

#### **Step 3: Book Appointment**
1. Click on a doctor card
2. You'll see doctor profile with:
   - Doctor details
   - Available time slots
   - Consultation mode options (Online/In-person)
3. Select a **time slot**
4. Choose **"Online"** or **"In-Person"**
5. Enter **"Reason for Visit"** (e.g., "General checkup")
6. Click **"Book Appointment"**
7. ✅ Appointment confirmed

#### **Step 4: Check Your Appointments**
1. Go to **"My Appointments"** from dashboard
2. See all your appointments:
   - **Upcoming**: Show doctor name, date, time
   - **Past**: Show history

#### **Step 5: Use Queue Tracker (In-Person Only)**
1. For in-person appointments:
   - Go to: **http://localhost:5173/queue-tracker**
2. You'll see:
   - **Your Token Number**: e.g., #5
   - **Position in Queue**: Position 1, 2, 3, etc.
   - **People Ahead**: 4 people ahead
   - **Wait Time**: ~12 minutes
   - **Current Token**: #3 (being served now)
3. When **2 people ahead** → Get notification: "You're next soon!"
4. Position updates every **10 seconds** with latest wait time

#### **Step 6: File Price Dispute (if needed)**
1. If clinic charged different price than displayed:
   - Go to appointment details
   - Click **"Report Price Mismatch"**
2. Form shows:
   - **Locked Fee**: Price in app (₹500)
   - **Clinic Price**: What you paid (₹700)
   - **Difference**: ₹200 overcharge
3. Upload receipt as proof
4. Click **"Submit Dispute"**
5. ✅ Admin reviews (24 hours)
6. Refund issued if approved

#### **Step 7: Get Refund Status**
1. Go to **"Refunds"** section
2. See all your refunds with status:
   - **REQUESTED**: Just filed
   - **APPROVED**: Admin approved
   - **PROCESSING**: Being processed
   - **CREDITED**: Added to your wallet ✅
3. Click refund to see:
   - Events timeline
   - Status history
   - Approval dates

#### **Step 8: Contact Support**
1. Click **"Support"** or **"Help"**
2. Start chat with bot
3. Ask your question (e.g., "Cancel appointment")
4. If bot can't help → Click **"Talk to Agent"**
5. Human agent takes over
6. Chat history preserved
7. Rate support with emoji 😊😐😞

#### **Step 9: Use Symptom Matcher**
1. Go to **"Symptom Checker"** or search for feature
2. Enter **symptoms**: "chest pain, shortness of breath"
3. System returns:
   - **Matched Specialties**: Cardiology (95% match)
   - **Red Flags**: Warnings if urgent
   - **Matching Doctors**: List of cardiologists
4. Click **"Book Appointment"** on any doctor
5. Redirected to doctor profile for booking

---

### 👨‍⚕️ DOCTOR WORKFLOW

#### **Step 1: Sign Up as Doctor**
1. Click **"Sign Up"**
2. Select **"I am a: Doctor"**
3. Fill form:
   - **Full Name**: Your name
   - **Email**: Your email
   - **Phone**: Phone number
   - **Password**: At least 8 characters
4. Click **"Sign up"**
5. ✅ Auto-login → Doctor Dashboard

#### **Step 2: Doctor Dashboard**
Shows:
- **Today's Appointments**: Number of patients today
- **Next Appointment**: When is your next patient?
- **Queue Status**: How many patients waiting
- **Earnings**: Today's earnings
- Your status badge

#### **Step 3: Update Your Status**
1. Click **"Update Status"** on dashboard
2. Options:
   - **"On Time"**: You're available
   - **"Running Late"**: Select delay (e.g., 20 minutes)
   - **"On Leave"**: Set start & end dates
   - **"Unavailable"**: Not taking appointments
3. Patients see status in real-time:
   - Estimated wait time updates
   - Appointment times adjust

#### **Step 4: View Appointments**
1. Click **"Today's Appointments"** or **"All Appointments"**
2. See patient list with:
   - Patient name
   - Appointment time
   - Reason for visit
   - Consultation mode (Online/In-person)
   - Status (Scheduled, Checked-in, Called, In Progress)

#### **Step 5: Start Consultation**
1. When patient checks in:
   - Patient gets **token number**
   - Appears in your **queue**
2. For in-person:
   - Call patient's token: Click **"Call Next"**
   - Patient gets notified with sound/message
3. For online:
   - Patient joins video call
   - Click **"Start Consultation"**
4. During consultation:
   - Add **notes**
   - Record **duration** (for wait time accuracy)
5. Click **"End Consultation"** when done

#### **Step 6: Next Patient**
1. Click **"Call Next Patient"** button
2. System:
   - Marks current patient done
   - Updates queue
   - Patient at position 2 gets alert: "You're next!"
   - Calls next patient in queue

---

## KEY FEATURES EXPLAINED

### 🚨 Live Queue System
- **Check-in**: Patient says "I'm here" at clinic
- **Token**: Patient gets number (e.g., #5)
- **Position**: Shows how many ahead
- **Wait Time**: Calculated from doctor's pace
- **2-Person Alert**: "You're 2 people away" notification
- **Live Updates**: Every 10 seconds

### 💰 Price Match Guarantee
- **Locked Fee**: Price shown in app (₹500)
- **Clinic Price**: Actual price charged (₹700)
- **Auto-Detection**: System alerts if different
- **Dispute**: File with receipt
- **Refund**: Auto-generated if approved

### 🔄 Refund Tracker
- **Status Flow**: REQUESTED → APPROVED → PROCESSING → CREDITED
- **Timeline**: See when each step happens
- **Wallet**: Refund credited to your account
- **Notifications**: Get update at each stage

### 💬 Support Chat
- **Bot First**: Try automated help first
- **Escalate**: "Talk to agent" for human help
- **Agent**: Real person takes over
- **History**: Full conversation saved
- **Rating**: Rate support quality

### 🏥 Doctor Status
- Patients see **real-time status**:
  - ✅ On Time (10 min wait)
  - ⏱️ Running Late (35 min wait)
  - 📅 On Leave (back on Oct 5)
  - ❌ Unavailable (can't book)

### 🔍 Symptom Matcher
- Enter **symptoms**: "chest pain"
- Get **specialties**: Cardiology (95%)
- See **matching doctors**: List of specialists
- **Book directly**: One click to appointment

---

## EXAMPLE WORKFLOWS

### 📋 COMPLETE PATIENT JOURNEY

**Day 1 - Registration & Search**
```
1. Sign up at http://localhost:5173/signup
2. Enter: name="Raj Kumar", email="raj@gmail.com", password="Raj123456"
3. Auto-login → Home page
4. Click "Search Doctors"
5. Filter: Specialty = "Cardiology"
6. See: Dr. Sharma (Cardiologist, ₹500 fee, AVAILABLE)
7. Click doctor → See profile
8. Click "Book Appointment"
9. Select: Oct 5, 2:00 PM, Online mode
10. Reason: "Chest pain checkup"
11. Click "Book Now"
12. ✅ Appointment confirmed! Email sent.
```

**Day 2 - Appointment Day (In-Person)**
```
1. Go to appointment location
2. Reception: "Say you're here"
3. System: "You got token #5"
4. Go to http://localhost:5173/queue-tracker
5. See: Position 5, Wait: 12 min
6. Position updates: 5 → 4 → 3 → 2 (Alert! "You're next!")
7. Position: 2 → 1 (Current token being served)
8. Position: 1 → CALLED! (Your turn!)
9. Go see doctor
10. Doctor finishes consultation
```

**Day 3 - After Appointment**
```
1. Get invoice: ₹500 (locked fee)
2. But clinic charged: ₹700!
3. Go to Appointments
4. Click "Report Price Mismatch"
5. Form auto-shows: ₹700 vs ₹500 = ₹200 overcharge
6. Upload receipt
7. Submit dispute
8. Admin reviews (24 hours)
9. Day 4: Approved! Refund ₹200
10. Go to "Refunds" → See status: CREDITED ✅
11. Wallet updated: +₹200
```

### 👨‍⚕️ DOCTOR'S DAY

```
Morning:
1. Login as doctor
2. Dashboard shows: 12 appointments today
3. Click "Update Status" → "On Time"
4. Patients see: "Dr. available, 10 min wait"

10:00 AM - First patient:
1. Queue shows: 5 patients waiting
2. Click "Call Next" → Patient #1 called
3. Patient comes in, click "Start Consultation"
4. Talk for 5 minutes
5. Add notes: "Take antibiotics"
6. Click "End Consultation"

10:10 AM - Next:
1. Click "Call Next" → Patient #2 called
2. (Patient at position 2 gets alert: "You're next!")
3. Patient comes in
4. ... repeat ...

12:00 PM - Lunch:
1. Click "Update Status" → "On Leave"
2. Set: 12:00 PM - 1:00 PM
3. Patients see: "On break, back at 1 PM"

1:00 PM - Resume:
1. Click "Update Status" → "On Time"
2. Continue seeing patients

Running Late:
1. Click "Update Status" → "Running Late"
2. Set delay: 20 minutes
3. All waiting patients see: "20 min delay"
4. Wait times update in real-time
```

---

## NAVIGATION SHORTCUTS

| Feature | URL | Role |
|---------|-----|------|
| Home | http://localhost:5173 | All |
| Sign Up | http://localhost:5173/signup | Guest |
| Login | http://localhost:5173/login | Guest |
| Search Doctors | http://localhost:5173/search | Patient |
| My Appointments | http://localhost:5173/appointments | Patient |
| Queue Tracker | http://localhost:5173/queue-tracker | Patient |
| Doctor Dashboard | http://localhost:5173/doctor/dashboard | Doctor |
| Support/Chat | http://localhost:5173/support | All |

---

## TROUBLESHOOTING

### ❌ "Invalid email or password" on login
- Check spelling of email
- Passwords are case-sensitive
- Make sure you signed up first

### ❌ "Email already registered"
- Email is taken
- Use different email
- Or login if you have account

### ❌ "No doctors found"
- No doctors have signed up yet
- Create doctor account first
- Or add filters (may be filtering out available doctors)

### ❌ Queue tracker shows "No position found"
- Only works for checked-in appointments
- For in-person appointments only
- Check in at clinic reception first

### ❌ "Chat agent not available"
- All agents are busy
- Try again later
- Or wait for agent to respond

### ❌ Price mismatch not detected
- Auto-detection requires both prices
- Make sure to enter what clinic charged
- Upload receipt as proof

---

## CONTACT & SUPPORT

**Have questions?**
1. Click **"Support"** in navbar
2. Chat with bot or escalate to agent
3. Or submit **"Report Issue"** form

**Report bugs?**
- Use support chat
- Describe what went wrong
- Include screenshots if possible

---

**That's it! You now know how to use CareSync! 🎉**

For more details, see `TESTING_GUIDE.md`
