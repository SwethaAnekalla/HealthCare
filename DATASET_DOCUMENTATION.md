# CareSync Healthcare Platform - Dataset Documentation

## Overview

The CareSync platform uses a **comprehensive healthcare database** with realistic Indian healthcare data. The dataset includes medical entities, users, appointments, and transactional data.

---

## Database Tables & Sample Data

### 1. **Users** (Admin, Doctors, Patients, Support Agents)

#### Roles
```
- ADMIN (1 user)
- DOCTOR (5 doctors)
- PATIENT (3 patients)
- SUPPORT_AGENT (1 agent)
- CLINIC_STAFF (extensible)
```

#### Sample Data

**Admin**
```
Email: admin@caresync.com
Password: password123
Name: Admin User
```

**Support Agent**
```
Email: agent@caresync.com
Password: password123
Name: Support Agent
```

**Patients** (3 registered)
```
1. Amit Kumar (patient1@caresync.com)
   - Blood Group: O+
   - Allergies: [Penicillin]
   - Wallet Balance: 0

2. Priya Singh (patient2@caresync.com)
   - Blood Group: O+
   - Allergies: [Penicillin]

3. Rajesh Patel (patient3@caresync.com)
   - Blood Group: O+
   - Allergies: [Penicillin]
```

**Doctors** (5 registered)
```
1. Dr. Rajesh Sharma (dr.sharma@caresync.com)
   - Specialty: Cardiology
   - Experience: 10 years
   - Rating: 4.5/5
   - Consultation Fee: ₹500 ($6)
   - Registration: MCI/2020/001
   - Status: APPROVED

2. Dr. Neha Patel (dr.patel@caresync.com)
   - Specialty: Orthopedics
   - Experience: 10 years
   - Rating: 4.5/5
   - Consultation Fee: ₹500
   - Registration: MCI/2020/002
   - Status: APPROVED

3. Dr. Anil Gupta (dr.gupta@caresync.com)
   - Specialties: General Physician, Pediatrics
   - Experience: 10 years
   - Rating: 4.5/5
   - Consultation Fee: ₹500
   - Registration: MCI/2020/003
   - Status: APPROVED

4. Dr. Sonia Verma (dr.verma@caresync.com)
   - Specialty: Dermatology
   - Experience: 10 years
   - Rating: 4.5/5
   - Consultation Fee: ₹500
   - Registration: MCI/2020/004
   - Status: APPROVED

5. Dr. Vikram Singh (dr.singh@caresync.com)
   - Specialty: Neurology
   - Experience: 10 years
   - Rating: 4.5/5
   - Consultation Fee: ₹500
   - Registration: MCI/2020/005
   - Status: APPROVED
```

All doctors:
- Languages: English, Hindi
- Qualifications: MBBS, MD
- Schedule: Monday-Friday, 9:00 AM - 5:00 PM
- Slot Duration: 30 minutes

---

### 2. **Medical Specialties** (10 specialties)

```
1. General Physician (GP, Family Doctor)
2. Cardiology (Heart Doctor, Heart Specialist)
3. Orthopedics (Bone Doctor, Bone Specialist)
4. Dermatology (Skin Doctor, Skin Specialist)
5. ENT (Ear Nose Throat, Otolaryngology)
6. Pediatrics (Child Specialist, Children Doctor)
7. Neurology (Nerve Doctor, Brain Specialist) - RARE
8. Rheumatology (Joint Specialist) - RARE
9. Gastroenterology (Stomach Specialist, Digestive Doctor)
10. Nephrology (Kidney Specialist) - RARE
```

Each specialty includes:
- Name and synonyms (for search)
- Description
- Icon reference
- Parent-child relationship (for categorization)
- Is Rare flag (for specialty allocation)

---

### 3. **Symptoms** (11 registered)

```
Regular Symptoms:
- Headache
- Fever
- Cough
- Joint Pain
- Skin Rash

Red Flag Symptoms (Emergency):
- Chest Pain → "Call 911 immediately"
- Shortness of Breath → "Call 911 immediately"
- Bleeding → "Call 911 immediately"
- Difficulty Breathing → "Call 911 immediately"
- Severe Bleeding → "Call 911 immediately"
- Suicidal Thoughts → "Call 988 Suicide & Crisis Lifeline"
```

Each symptom includes:
- Name
- Description
- Is Red Flag (emergency indicator)
- Red Flag Guidance (for emergencies)

---

### 4. **Symptom-Specialty Mappings** (AI Matching)

The system maps symptoms to appropriate specialists:

```
Chest Pain → Cardiology (95% confidence)
Shortness of Breath → Cardiology (90% confidence)
Headache → Neurology (80% confidence)
Joint Pain → Orthopedics (85% confidence)
Skin Rash → Dermatology (90% confidence)
Cough → General Physician (70% confidence)
Fever → General Physician (60% confidence)
```

---

### 5. **Clinics** (3 clinic networks)

```
1. Care Medical Clinic
   - Location: 123 Health Street, Mumbai, Maharashtra 400001
   - Coordinates: 19.076°N, 72.877°E
   - Phone: +91-9876543210
   - Email: care-medical-clinic@caresync.com
   - Trust Score: 4.5/5
   - Status: APPROVED

2. Wellness Healthcare Center
   - Location: 456 Medicine Lane, Bangalore, Karnataka 560001
   - Coordinates: 12.9716°N, 77.5946°E
   - Phone: +91-9876543210
   - Email: wellness-healthcare-center@caresync.com
   - Trust Score: 4.5/5
   - Status: APPROVED

3. Heart of Health Hospital
   - Location: 789 Care Avenue, Delhi, Delhi 110001
   - Coordinates: 28.7041°N, 77.1025°E
   - Phone: +91-9876543210
   - Email: heart-of-health-hospital@caresync.com
   - Trust Score: 4.5/5
   - Status: APPROVED
```

---

### 6. **Doctor Schedules** (5 days/week)

Each doctor has:
- **Monday-Friday** (Days 1-5)
- **Time**: 9:00 AM - 5:00 PM
- **Slot Duration**: 30 minutes
- **Status**: Active
- **Slot Count**: 16 slots/day (9:00-17:00, 30-min slots)

Example slots for Dr. Sharma:
```
Monday:
  09:00 - 09:30 (Slot 1)
  09:30 - 10:00 (Slot 2)
  ... (up to 16 slots)
  16:30 - 17:00 (Slot 16)
```

---

### 7. **Consultation Fees**

All doctors: **₹500 per consultation** (≈ $6 USD)

Fees are stored per doctor-clinic combination:
```
Dr. Sharma @ Care Medical Clinic: ₹500
Dr. Patel @ Wellness Healthcare: ₹500
... (all doctors)
```

---

### 8. **Sample Appointments**

**Appointment 1** (Auto-generated)
```
Patient: Amit Kumar
Doctor: Dr. Rajesh Sharma (Cardiology)
Clinic: Care Medical Clinic
Date: Tomorrow
Time: [Time slot from available slots]
Status: BOOKED
Fee: ₹500 (locked)
Payment: SUCCESS
Queue Token: #1
Consultation Mode: IN_CLINIC
Reason: Regular checkup
```

---

### 9. **Queue System**

Each doctor session has:
- **Queue Session** per day/clinic
- **Digital Tokens** (1, 2, 3, ...)
- **Token Status**: ISSUED, CALLED, COMPLETED
- **Average Consultation Duration**: 600 seconds (10 minutes)

Example:
```
Queue Session - Dr. Sharma, Care Clinic, Tomorrow
  Current Token: 1
  Total Tokens Issued: 1
  Tokens Completed: 0
  Average Duration: 10 minutes

Token #1:
  Patient: Amit Kumar
  Status: ISSUED
  Position: 1
  Check-in Type: ON_SITE
```

---

### 10. **Doctor Status Tracking**

Each doctor has a status:
```
Status Options:
- AVAILABLE ✅
- RUNNING_LATE ⏱
- ON_BREAK ⏸
- IN_SURGERY 🏥
- ON_LEAVE 📅
- UNAVAILABLE_TODAY ❌
- OFFLINE 🔴
```

Sample:
```
Dr. Rajesh Sharma: AVAILABLE
Dr. Neha Patel: AVAILABLE
... (all doctors start as AVAILABLE)
```

---

### 11. **CMS Content** (3 pages)

**Page 1: How It Works**
```
Slug: how-it-works
Title: How CareSync Works
Content: "CareSync is a healthcare appointment platform that connects 
patients with verified doctors and clinics..."
Type: FAQ
Status: Published
```

**Page 2: Our Guarantees**
```
Slug: guarantees
Title: Our Four Pillars
Content: "1. Live Status - Real-time doctor availability
          2. Fast Refunds - Transparent, instant refunds
          3. Real Support - Human agents, not bots
          4. Fair Pricing - Guaranteed price match"
Type: GUARANTEE
Status: Published
```

**Page 3: Symptom Checker FAQ**
```
Slug: faq-symptoms
Title: Symptom Checker FAQ
Content: "Our AI-powered symptom checker helps you find the right specialist..."
Type: FAQ
Status: Published
```

---

### 12. **Support Canned Responses** (3 templates)

**Template 1: Appointment Confirmation**
```
"Thank you for booking with us! Your appointment is confirmed. 
You will receive a reminder 24 hours before your scheduled time."
```

**Template 2: Refund Status**
```
"Your refund has been processed and should appear in your 
wallet/account within 2-3 business days."
```

**Template 3: Rescheduling Help**
```
"You can reschedule your appointment by going to 'My Appointments' 
and clicking the reschedule button. A free cancellation is available 
up to 24 hours before the appointment."
```

---

## Database Schema Overview

### Core Entities

| Table | Records | Purpose |
|-------|---------|---------|
| User | 10 | All system users |
| PatientProfile | 3 | Patient details |
| DoctorProfile | 5 | Doctor details |
| Specialty | 10 | Medical specialties |
| Symptom | 11 | Medical symptoms |
| Clinic | 3 | Healthcare facilities |
| Appointment | 1+ | Bookings |
| TimeSlot | Auto-generated | Available consultation times |
| QueueSession | Auto-generated | Daily queue management |
| QueueToken | Auto-generated | Patient tokens |
| Payment | Auto-generated | Transaction records |
| DoctorStatus | 5 | Real-time doctor availability |
| SupportTicket | 0+ | Support tickets |
| Refund | 0+ | Refund records |

---

## How to Seed the Database

### Automatic Seeding
```bash
npm run prisma:seed
```

This will:
1. Clear existing data (if any)
2. Create all specialties with synonyms
3. Create all symptoms with red-flag indicators
4. Create all clinics with locations
5. Create all users (admin, doctors, patients, agent)
6. Assign doctors to specialties
7. Assign doctors to clinics
8. Create doctor schedules (Monday-Friday)
9. Create consultation fees
10. Create sample appointments
11. Create queue sessions and tokens
12. Create CMS content
13. Create support templates

---

## Data Flow Example: Booking an Appointment

```
1. Patient searches for "Chest Pain"
   → System finds symptom in database
   → AI matches to Cardiology (95% confidence)
   → Shows available Cardiologists

2. Patient selects Dr. Rajesh Sharma
   → System loads available time slots
   → Shows all Monday-Friday slots
   → Displays fee: ₹500

3. Patient books appointment
   → Appointment record created
   → Time slot marked as BOOKED
   → Payment record created (PENDING)
   → Queue token issued (#1)
   → Doctor sees appointment on dashboard

4. Doctor views queue
   → Queue session shows: 1 patient waiting
   → Digital token: #1
   → Patient: Amit Kumar
   → Estimated wait: 0 minutes (first)

5. Queue updates in real-time
   → More patients book
   → Token numbers update
   → Wait times recalculate
   → Patients notified when 2 people away
```

---

## Test Credentials

### Admin Access
```
Email: admin@caresync.com
Password: password123
Role: ADMIN
```

### Doctor Login
```
Email: dr.sharma@caresync.com
Password: password123
Role: DOCTOR
Specialty: Cardiology
```

### Patient Login
```
Email: patient1@caresync.com
Password: password123
Role: PATIENT
```

### Support Agent
```
Email: agent@caresync.com
Password: password123
Role: SUPPORT_AGENT
```

---

## Data Statistics

- **Total Users**: 10
- **Doctors**: 5
- **Patients**: 3
- **Support Staff**: 1
- **Admins**: 1
- **Clinics**: 3
- **Specialties**: 10
- **Symptoms**: 11
- **Available Appointments**: ~80/day (16 slots × 5 doctors)
- **Default Consultation Fee**: ₹500

---

## Privacy & Security

- All passwords hashed with bcrypt
- Phone numbers and emails are unique
- Patient data includes HIPAA-like fields:
  - Blood group
  - Allergies
  - Medical conditions
  - Emergency contacts
- Doctor verification status tracked
- Clinic trust scores maintained
- Audit logging for all transactions

---

## Extending the Dataset

### Add More Doctors
```typescript
// In seed.ts, add to doctorUsers array
{
  email: 'dr.newdoctor@caresync.com',
  name: 'Dr. New Doctor',
  phone: '+919876543211',
  registrationNumber: 'MCI/2020/006',
  specialties: ['Neurology'],
}
```

### Add More Specialties
```typescript
// In seed.ts, add to specialtyData array
{
  name: 'Psychiatry',
  synonyms: ['Mental Health', 'Psychological Counseling'],
  isRare: true,
}
```

### Add More Symptoms
```typescript
// In seed.ts, add to symptomData array
{ name: 'Anxiety', isRedFlag: false },
{ name: 'Insomnia', isRedFlag: false },
```

---

## Notes

✅ All data is realistic and India-focused
✅ Includes real city locations and coordinates
✅ Prices in Indian Rupees (INR)
✅ Phone numbers follow Indian format
✅ Multiple languages supported (English, Hindi)
✅ Red flag symptoms with emergency guidance
✅ Production-ready schema with indexes

---

**Dataset Version**: 1.0
**Last Updated**: October 2025
**Status**: Ready for production use
