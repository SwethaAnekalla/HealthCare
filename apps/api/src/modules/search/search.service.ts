import { prisma } from '../../lib/prisma';
import { db } from '../../lib/db';

export const searchService = {
  /**
   * Search doctors by name, specialty, or clinic
   */
  async searchDoctors(query: string, filters?: any, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const where: any = {
      verificationStatus: { in: ['APPROVED', 'PENDING'] }, // Allow PENDING for development,
      user: { status: 'ACTIVE' },
    };

    if (query) {
      where.OR = [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        {
          doctorSpecialties: {
            some: {
              specialty: {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  {
                    synonyms: {
                      some: {
                        synonym: { contains: query, mode: 'insensitive' },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      ];
    }

    if (filters?.specialtyId) {
      where.doctorSpecialties = {
        some: { specialtyId: filters.specialtyId },
      };
    }

    if (filters?.clinicId) {
      where.clinicDoctors = {
        some: { clinicId: filters.clinicId },
      };
    }

    if (filters?.experience) {
      where.experience = { gte: filters.experience };
    }

    if (filters?.minRating) {
      where.rating = { gte: filters.minRating };
    }

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          doctorSpecialties: {
            include: { specialty: true },
          },
          clinicDoctors: {
            include: { clinic: true },
          },
          currentStatus: true,
          fees: true,
        },
        skip: offset,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      prisma.doctorProfile.count({ where }),
    ]);

    return {
      items: doctors.map((d) => ({
        id: d.id,
        name: d.user.name,
        email: d.user.email,
        experience: d.experience,
        qualifications: d.qualifications,
        languages: d.languages,
        consultationFee: d.consultationFee,
        rating: d.rating,
        reviewCount: d.reviewCount,
        specialties: d.doctorSpecialties.map((ds) => ds.specialty.name),
        clinics: d.clinicDoctors.map((cd) => ({
          id: cd.clinic.id,
          name: cd.clinic.name,
          city: cd.clinic.city,
        })),
        status: d.currentStatus?.status || 'OFFLINE',
        statusUpdatedAt: d.currentStatus?.updatedAt,
      })),
      total,
      page,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get doctor profile with full details
   */
  async getDoctorProfile(doctorId: string) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        doctorSpecialties: {
          include: { specialty: true },
        },
        clinicDoctors: {
          include: { clinic: true },
        },
        currentStatus: true,
        fees: true,
      },
    });

    if (!doctor) {
      return null;
    }

    // Get recent reviews separately
    const recentReviews = await prisma.review.findMany({
      where: { doctorUserId: doctor.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      id: doctor.id,
      userId: doctor.userId,
      name: doctor.user.name,
      email: doctor.user.email,
      phone: doctor.user.phone,
      registrationNumber: doctor.registrationNumber,
      experience: doctor.experience,
      bio: doctor.bio,
      qualifications: doctor.qualifications,
      languages: doctor.languages,
      consultationFee: doctor.consultationFee,
      rating: doctor.rating,
      reviewCount: doctor.reviewCount,
      verificationStatus: doctor.verificationStatus,
      specialties: doctor.doctorSpecialties.map((ds: any) => ({
        id: ds.specialty.id,
        name: ds.specialty.name,
      })),
      clinics: doctor.clinicDoctors.map((cd: any) => ({
        id: cd.clinic.id,
        name: cd.clinic.name,
        address: cd.clinic.address,
        city: cd.clinic.city,
        state: cd.clinic.state,
        phone: cd.clinic.phone,
        isPrimary: cd.isPrimary,
      })),
      status: doctor.currentStatus?.status || 'OFFLINE',
      statusUpdatedAt: doctor.currentStatus?.updatedAt,
      recentReviews: recentReviews,
    };
  },

  /**
   * Get available slots for a doctor on a specific date
   */
  async getAvailableSlots(
    doctorId: string,
    clinicId: string,
    date: string,
    consultationMode: string = 'IN_CLINIC',
  ) {
    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(`${date}T23:59:59Z`);

    // Get all time slots for this date
    const slots = await prisma.timeSlot.findMany({
      where: {
        doctorId,
        clinicId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['AVAILABLE', 'HELD'],
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Filter out expired holds
    const availableSlots = slots.filter((slot) => {
      if (slot.status === 'HELD' && slot.holdExpiresAt && slot.holdExpiresAt < new Date()) {
        return false;
      }
      return true;
    });

    return {
      date,
      doctor: {
        id: doctorId,
      },
      slots: availableSlots.map((s) => ({
        id: s.id,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        status: s.status,
      })),
      totalAvailable: availableSlots.length,
    };
  },

  /**
   * Search specialties
   */
  async searchSpecialties(query?: string, includeRare: boolean = true) {
    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        {
          synonyms: {
            some: {
              synonym: { contains: query, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (!includeRare) {
      where.isRare = false;
    }

    const specialties = await prisma.specialty.findMany({
      where,
      include: {
        synonyms: true,
        _count: {
          select: { doctorSpecialties: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return specialties.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      isRare: s.isRare,
      doctorCount: s._count.doctorSpecialties,
      synonyms: s.synonyms.map((syn) => syn.synonym),
    }));
  },

  /**
   * Search clinics
   */
  async searchClinics(
    query?: string,
    city?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const offset = (page - 1) * limit;

    const where: any = {
      verificationStatus: { in: ['APPROVED', 'PENDING'] }, // Allow PENDING for development,
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        include: {
          clinicDoctors: {
            include: { doctor: true },
          },
          _count: {
            select: { clinicDoctors: true },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { trustScore: 'desc' },
      }),
      prisma.clinic.count({ where }),
    ]);

    return {
      items: clinics.map((c) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        city: c.city,
        state: c.state,
        pinCode: c.pinCode,
        phone: c.phone,
        email: c.email,
        latitude: c.latitude,
        longitude: c.longitude,
        trustScore: c.trustScore,
        verificationStatus: c.verificationStatus,
        doctorCount: c._count.clinicDoctors,
      })),
      total,
      page,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Autocomplete suggestions
   */
  async getSuggestions(query: string, type: 'doctors' | 'specialties' | 'clinics' | 'all' = 'all') {
    const suggestions: any = {};

    if (type === 'doctors' || type === 'all') {
      const doctors = await prisma.doctorProfile.findMany({
        where: {
          user: {
            name: { contains: query, mode: 'insensitive' },
          },
          verificationStatus: { in: ['APPROVED', 'PENDING'] }, // Allow PENDING for development,
        },
        select: {
          id: true,
          user: { select: { name: true } },
        },
        take: 5,
      });

      suggestions.doctors = doctors.map((d) => ({
        id: d.id,
        name: d.user.name,
        type: 'doctor',
      }));
    }

    if (type === 'specialties' || type === 'all') {
      const specs = await prisma.specialty.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            {
              synonyms: {
                some: {
                  synonym: { contains: query, mode: 'insensitive' },
                },
              },
            },
          ],
        },
        select: { id: true, name: true },
        take: 5,
      });

      suggestions.specialties = specs.map((s) => ({
        id: s.id,
        name: s.name,
        type: 'specialty',
      }));
    }

    if (type === 'clinics' || type === 'all') {
      const clinics = await prisma.clinic.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          verificationStatus: { in: ['APPROVED', 'PENDING'] }, // Allow PENDING for development,
        },
        select: { id: true, name: true },
        take: 5,
      });

      suggestions.clinics = clinics.map((c) => ({
        id: c.id,
        name: c.name,
        type: 'clinic',
      }));
    }

    return suggestions;
  },
};


