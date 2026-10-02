import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function clearDatabase() {
  const tables = [
    'AuditLog',
    'CmsContent',
    'SystemSetting',
    'NotificationPreference',
    'Notification',
    'PushSubscription',
    'CsatRating',
    'CannedResponse',
    'ChatMessage',
    'ChatConversation',
    'SymptomMatchLog',
    'Review',
    'PrescriptionItem',
    'Prescription',
    'PriceDispute',
    'FeeHistory',
    'Fee',
    'DoctorPaceMetric',
    'QueueToken',
    'QueueSession',
    'WalletTransaction',
    'Wallet',
    'RefundEvent',
    'Refund',
    'Payment',
    'Appointment',
    'TimeSlot',
    'DoctorStatusHistory',
    'DoctorStatus',
    'DoctorLeave',
    'DoctorSchedule',
    'DoctorSpecialty',
    'ClinicStaff',
    'ClinicDoctor',
    'SupportAgent',
    'HealthRecord',
    'FamilyMember',
    'PatientProfile',
    'User',
    'DoctorProfile',
    'SpecialtySynonym',
    'SymptomSpecialtyMap',
    'Symptom',
    'Specialty',
    'Clinic',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch (e) {
      console.log(`Skipping ${table}...`);
    }
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('Cleaning existing data...');
  await clearDatabase();

  console.log('✅ Data cleared');

  // Create Specialties with synonyms
  console.log('Creating specialties...');
  const specialtyData = [
    {
      name: 'General Physician',
      synonyms: ['GP', 'Family Doctor', 'General Doctor'],
      isRare: false,
    },
    {
      name: 'Cardiology',
      synonyms: ['Heart Doctor', 'Heart Specialist', 'Cardiologist'],
      isRare: false,
    },
    {
      name: 'Orthopedics',
      synonyms: ['Bone Doctor', 'Bone Specialist', 'Orthopaedics'],
      isRare: false,
    },
    {
      name: 'Dermatology',
      synonyms: ['Skin Doctor', 'Skin Specialist', 'Dermatologist'],
      isRare: false,
    },
    {
      name: 'ENT',
      synonyms: ['Ear Nose Throat', 'Otolaryngology', 'Otolaryngologist'],
      isRare: false,
    },
    {
      name: 'Pediatrics',
      synonyms: ['Child Specialist', 'Children Doctor', 'Pediatrician'],
      isRare: false,
    },
    {
      name: 'Neurology',
      synonyms: ['Nerve Doctor', 'Brain Specialist', 'Neurologist'],
      isRare: true,
    },
    {
      name: 'Rheumatology',
      synonyms: ['Joint Specialist', 'Rheumatologist'],
      isRare: true,
    },
    {
      name: 'Gastroenterology',
      synonyms: ['Stomach Specialist', 'Digestive Doctor', 'Gastroenterologist'],
      isRare: false,
    },
    {
      name: 'Nephrology',
      synonyms: ['Kidney Specialist', 'Nephrologist'],
      isRare: true,
    },
  ];

  const specialties = await Promise.all(
    specialtyData.map(async (s) => {
      const specialty = await prisma.specialty.create({
        data: {
          name: s.name,
          isRare: s.isRare,
          synonyms: {
            create: s.synonyms.map((syn) => ({ synonym: syn })),
          },
        },
      });
      return specialty;
    }),
  );

  console.log(`✅ Created ${specialties.length} specialties`);

  // Create Symptoms
  console.log('Creating symptoms...');
  const symptomData = [
    { name: 'Chest Pain', isRedFlag: true, guidance: 'Call emergency (911) immediately' },
    { name: 'Shortness of Breath', isRedFlag: true, guidance: 'Call emergency (911) immediately' },
    { name: 'Headache', isRedFlag: false },
    { name: 'Fever', isRedFlag: false },
    { name: 'Cough', isRedFlag: false },
    { name: 'Joint Pain', isRedFlag: false },
    { name: 'Skin Rash', isRedFlag: false },
    { name: 'Bleeding', isRedFlag: true, guidance: 'Call emergency (911) immediately' },
    { name: 'Difficulty Breathing', isRedFlag: true, guidance: 'Call emergency (911) immediately' },
    { name: 'Severe Bleeding', isRedFlag: true, guidance: 'Call emergency (911) immediately' },
    { name: 'Suicidal Thoughts', isRedFlag: true, guidance: 'Call 988 Suicide & Crisis Lifeline immediately' },
  ];

  const symptoms = await Promise.all(
    symptomData.map((s) =>
      prisma.symptom.create({
        data: {
          name: s.name,
          isRedFlag: s.isRedFlag,
          redFlagGuidance: s.guidance,
        },
      }),
    ),
  );

  console.log(`✅ Created ${symptoms.length} symptoms`);

  // Create Symptom-Specialty Mappings
  console.log('Creating symptom-specialty mappings...');
  const mappings = [
    { symptom: 'Chest Pain', specialty: 'Cardiology', weight: 0.95 },
    { symptom: 'Shortness of Breath', specialty: 'Cardiology', weight: 0.9 },
    { symptom: 'Headache', specialty: 'Neurology', weight: 0.8 },
    { symptom: 'Joint Pain', specialty: 'Orthopedics', weight: 0.85 },
    { symptom: 'Skin Rash', specialty: 'Dermatology', weight: 0.9 },
    { symptom: 'Cough', specialty: 'General Physician', weight: 0.7 },
    { symptom: 'Fever', specialty: 'General Physician', weight: 0.6 },
  ];

  for (const m of mappings) {
    const s = symptoms.find((s) => s.name === m.symptom);
    const sp = specialties.find((sp) => sp.name === m.specialty);
    if (s && sp) {
      await prisma.symptomSpecialtyMap.create({
        data: {
          symptomId: s.id,
          specialtyId: sp.id,
          weight: m.weight,
          reason: `Common presentation of ${m.specialty}`,
        },
      });
    }
  }

  console.log('✅ Created symptom-specialty mappings');

  // Create Clinics
  console.log('Creating clinics...');
  const clinicData = [
    {
      name: 'Care Medical Clinic',
      address: '123 Health Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      latitude: 19.076,
      longitude: 72.877,
    },
    {
      name: 'Wellness Healthcare Center',
      address: '456 Medicine Lane',
      city: 'Bangalore',
      state: 'Karnataka',
      pinCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
    },
    {
      name: 'Heart of Health Hospital',
      address: '789 Care Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pinCode: '110001',
      latitude: 28.7041,
      longitude: 77.1025,
    },
  ];

  const clinics = await Promise.all(
    clinicData.map((c) =>
      prisma.clinic.create({
        data: {
          name: c.name,
          address: c.address,
          city: c.city,
          state: c.state,
          pinCode: c.pinCode,
          latitude: c.latitude,
          longitude: c.longitude,
          phone: '+919876543210',
          email: `${c.name.toLowerCase().replace(/ /g, '-')}@caresync.com`,
          verificationStatus: 'APPROVED',
          trustScore: 4.5,
        },
      }),
    ),
  );

  console.log(`✅ Created ${clinics.length} clinics`);

  // Create Users (Admin, Doctors, Patients, Support Agent)
  console.log('Creating users...');

  const hashedPassword = await bcryptjs.hash('password123', 10);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@caresync.com',
      phone: '+919876543201',
      name: 'Admin User',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Support Agent
  const agentUser = await prisma.user.create({
    data: {
      email: 'agent@caresync.com',
      phone: '+919876543202',
      name: 'Support Agent',
      passwordHash: hashedPassword,
      role: 'SUPPORT_AGENT',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.supportAgent.create({
    data: {
      userId: agentUser.id,
      isOnline: true,
    },
  });

  // Patients
  const patientUsers = await Promise.all(
    [
      { email: 'patient1@caresync.com', name: 'Amit Kumar', phone: '+919876543203' },
      { email: 'patient2@caresync.com', name: 'Priya Singh', phone: '+919876543204' },
      { email: 'patient3@caresync.com', name: 'Rajesh Patel', phone: '+919876543205' },
    ].map((p) =>
      prisma.user.create({
        data: {
          ...p,
          passwordHash: hashedPassword,
          role: 'PATIENT',
          status: 'ACTIVE',
          emailVerified: true,
          patientProfile: {
            create: {
              bloodGroup: 'O+',
              allergies: ['Penicillin'],
            },
          },
          wallet: {
            create: {
              balance: 0,
            },
          },
          notificationPreferences: {
            create: {
              inAppEnabled: true,
              pushEnabled: true,
              emailEnabled: true,
            },
          },
        },
        include: { patientProfile: true },
      }),
    ),
  );

  console.log(`✅ Created ${patientUsers.length} patients`);

  // Doctors
  const doctorUsers = await Promise.all(
    [
      {
        email: 'dr.sharma@caresync.com',
        name: 'Dr. Rajesh Sharma',
        phone: '+919876543206',
        registrationNumber: 'MCI/2020/001',
        specialties: ['Cardiology'],
      },
      {
        email: 'dr.patel@caresync.com',
        name: 'Dr. Neha Patel',
        phone: '+919876543207',
        registrationNumber: 'MCI/2020/002',
        specialties: ['Orthopedics'],
      },
      {
        email: 'dr.gupta@caresync.com',
        name: 'Dr. Anil Gupta',
        phone: '+919876543208',
        registrationNumber: 'MCI/2020/003',
        specialties: ['General Physician', 'Pediatrics'],
      },
      {
        email: 'dr.verma@caresync.com',
        name: 'Dr. Sonia Verma',
        phone: '+919876543209',
        registrationNumber: 'MCI/2020/004',
        specialties: ['Dermatology'],
      },
      {
        email: 'dr.singh@caresync.com',
        name: 'Dr. Vikram Singh',
        phone: '+919876543210',
        registrationNumber: 'MCI/2020/005',
        specialties: ['Neurology'],
      },
    ].map((d) =>
      prisma.user.create({
        data: {
          email: d.email,
          name: d.name,
          phone: d.phone,
          passwordHash: hashedPassword,
          role: 'DOCTOR',
          status: 'ACTIVE',
          emailVerified: true,
          doctorProfile: {
            create: {
              registrationNumber: d.registrationNumber,
              experience: 10,
              bio: `${d.name} is an experienced doctor with 10 years of practice`,
              languages: ['English', 'Hindi'],
              qualifications: ['MBBS', 'MD'],
              consultationFee: 500 * 100, // in paise
              verificationStatus: 'APPROVED',
              rating: 4.5,
            },
          },
        },
        include: { doctorProfile: true },
      }),
    ),
  );

  console.log(`✅ Created ${doctorUsers.length} doctors`);

  // Assign doctors to specialties and clinics
  console.log('Assigning doctors to specialties and clinics...');
  for (let i = 0; i < doctorUsers.length; i++) {
    const doctor = doctorUsers[i];
    const specialtyNames =
      i === 0
        ? ['Cardiology']
        : i === 1
          ? ['Orthopedics']
          : i === 2
            ? ['General Physician', 'Pediatrics']
            : i === 3
              ? ['Dermatology']
              : ['Neurology'];

    for (const specialtyName of specialtyNames) {
      const specialty = specialties.find((s) => s.name === specialtyName);
      if (specialty && doctor.doctorProfile) {
        await prisma.doctorSpecialty.create({
          data: {
            doctorId: doctor.doctorProfile.id,
            specialtyId: specialty.id,
          },
        });
      }
    }

    // Assign to clinic
    if (doctor.doctorProfile) {
      const clinic = clinics[i % clinics.length];
      await prisma.clinicDoctor.create({
        data: {
          doctorId: doctor.doctorProfile.id,
          clinicId: clinic.id,
          isPrimary: true,
        },
      });

      // Create doctor schedule
      for (let day = 1; day <= 5; day++) {
        // Monday to Friday
        await prisma.doctorSchedule.create({
          data: {
            doctorId: doctor.doctorProfile.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            slotDuration: 30,
            isActive: true,
          },
        });
      }

      // Create fee
      await prisma.fee.create({
        data: {
          doctorId: doctor.doctorProfile.id,
          clinicId: clinic.id,
          amount: 500 * 100, // 500 in paise
          version: 1,
          effectiveFrom: new Date(),
        },
      });

      // Create doctor status
      await prisma.doctorStatus.create({
        data: {
          doctorId: doctor.doctorProfile.id,
          status: 'AVAILABLE',
          setByUserId: doctor.id,
        },
      });
    }
  }

  console.log('✅ Assigned doctors to specialties, clinics, and schedules');

  // Create some appointments with all states
  console.log('Creating sample appointments...');
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const slot1 = await prisma.timeSlot.create({
    data: {
      doctorId: doctorUsers[0].doctorProfile!.id,
      clinicId: clinics[0].id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000),
      status: 'AVAILABLE',
    },
  });

  const appointment1 = await prisma.appointment.create({
    data: {
      patientUserId: patientUsers[0].id,
      patientId: patientUsers[0].patientProfile!.id,
      doctorUserId: doctorUsers[0].id,
      doctorId: doctorUsers[0].doctorProfile!.id,
      clinicId: clinics[0].id,
      slotId: slot1.id,
      status: 'BOOKED',
      consultationMode: 'IN_CLINIC',
      reason: 'Regular checkup',
      scheduledStart: slot1.startTime,
      scheduledEnd: slot1.endTime,
      lockedFee: 500 * 100,
      feeVersion: 1,
      lockedAt: new Date(),
    },
  });

  // Create payment for appointment 1
  await prisma.payment.create({
    data: {
      appointmentId: appointment1.id,
      amount: 500 * 100,
      status: 'SUCCESS',
      paymentMethod: 'CARD',
      providerReference: 'MOCK_PAY_001',
      idempotencyKey: `idempotency_${appointment1.id}`,
    },
  });

  // Create queue session and token
  const queueSession = await prisma.queueSession.create({
    data: {
      doctorId: doctorUsers[0].doctorProfile!.id,
      clinicId: clinics[0].id,
      date: tomorrow.toISOString().split('T')[0],
      status: 'ACTIVE',
      totalTokensIssued: 1,
      currentTokenNumber: 1,
      averageConsultationDuration: 600, // 10 minutes
    },
  });

  await prisma.queueToken.create({
    data: {
      appointmentId: appointment1.id,
      tokenNumber: 1,
      status: 'ISSUED',
      checkInType: 'ON_SITE',
    },
  });

  console.log('✅ Created sample appointments');

  // Create CMS content
  console.log('Creating CMS content...');
  await prisma.cmsContent.create({
    data: {
      slug: 'how-it-works',
      title: 'How CareSync Works',
      content: 'CareSync is a healthcare appointment platform that connects patients with verified doctors and clinics...',
      type: 'FAQ',
      isPublished: true,
    },
  });

  await prisma.cmsContent.create({
    data: {
      slug: 'guarantees',
      title: 'Our Four Pillars',
      content: '1. Live Status - Real-time doctor availability\n2. Fast Refunds - Transparent, instant refunds\n3. Real Support - Human agents, not bots\n4. Fair Pricing - Guaranteed price match',
      type: 'GUARANTEE',
      isPublished: true,
    },
  });

  await prisma.cmsContent.create({
    data: {
      slug: 'faq-symptoms',
      title: 'Symptom Checker FAQ',
      content: 'Our AI-powered symptom checker helps you find the right specialist...',
      type: 'FAQ',
      isPublished: true,
    },
  });

  // Create canned responses for support agents
  console.log('Creating canned responses...');
  await prisma.cannedResponse.create({
    data: {
      title: 'Appointment Confirmation',
      content: 'Thank you for booking with us! Your appointment is confirmed. You will receive a reminder 24 hours before your scheduled time.',
      category: 'APPOINTMENT',
    },
  });

  await prisma.cannedResponse.create({
    data: {
      title: 'Refund Status',
      content: 'Your refund has been processed and should appear in your wallet/account within 2-3 business days.',
      category: 'REFUND',
    },
  });

  await prisma.cannedResponse.create({
    data: {
      title: 'Rescheduling Help',
      content: 'You can reschedule your appointment by going to "My Appointments" and clicking the reschedule button. A free cancellation is available up to 24 hours before the appointment.',
      category: 'APPOINTMENT',
    },
  });

  console.log('✅ Created CMS content and canned responses');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
