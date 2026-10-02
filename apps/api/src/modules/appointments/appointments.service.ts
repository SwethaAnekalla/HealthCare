import { prisma } from '../../lib/prisma';
import { db } from '../../lib/db';
import { errors } from '../../lib/error';
import { logger } from '../../lib/logger';

export const appointmentsService = {
  /**
   * Create appointment with concurrency-safe booking
   */
  async createAppointment(
    patientId: string,
    patientUserId: string,
    data: any,
  ) {
    // Get slot and verify it's still available
    const slot = await prisma.timeSlot.findUnique({
      where: { id: data.slotId },
    });

    if (!slot) {
      throw errors.NOT_FOUND('Slot');
    }

    if (slot.status !== 'AVAILABLE' && slot.status !== 'HELD') {
      throw errors.SLOT_NOT_AVAILABLE();
    }

    // Check if hold is expired
    if (slot.status === 'HELD' && slot.holdExpiresAt && slot.holdExpiresAt < new Date()) {
      // Release expired hold
      await prisma.timeSlot.update({
        where: { id: data.slotId },
        data: { status: 'AVAILABLE', holdExpiresAt: null },
      });

      throw errors.SLOT_NOT_AVAILABLE();
    }

    // Check if patient already has appointment at this time
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        scheduledStart: {
          gte: new Date(slot.startTime.getTime() - 30 * 60 * 1000),
          lte: new Date(slot.startTime.getTime() + 30 * 60 * 1000),
        },
        status: {
          in: ['BOOKED', 'CONFIRMED', 'IN_CONSULTATION'],
        },
      },
    });

    if (existingAppointment) {
      throw errors.APPOINTMENT_ALREADY_EXISTS();
    }

    // Get current fee
    const fee = await prisma.fee.findFirst({
      where: {
        doctorId: data.doctorId,
        clinicId: data.clinicId,
      },
      orderBy: { version: 'desc' },
    });

    if (!fee) {
      throw errors.NOT_FOUND('Consultation fee not set');
    }

    // Create appointment in transaction (atomic booking)
    try {
      const result = await db.createAppointmentTransactional(
        {
          patientUserId,
          patientId,
          doctorUserId: data.doctorUserId,
          doctorId: data.doctorId,
          clinicId: data.clinicId,
          slotId: data.slotId,
          status: 'BOOKED',
          consultationMode: data.consultationMode,
          reason: data.reason,
          symptoms: data.symptoms || [],
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
          lockedFee: fee.amount,
          feeVersion: fee.version,
          lockedAt: new Date(),
        },
        {
          amount: fee.amount,
          status: 'PENDING',
          paymentMethod: 'PENDING',
          providerReference: `TEMP_${Date.now()}`,
          idempotencyKey: `booking_${patientId}_${data.slotId}_${Date.now()}`,
        },
      );

      logger.info(`Appointment created: ${result.appointment.id}`);

      return {
        appointment: {
          id: result.appointment.id,
          status: result.appointment.status,
          scheduledStart: result.appointment.scheduledStart.toISOString(),
          scheduledEnd: result.appointment.scheduledEnd.toISOString(),
          lockedFee: result.appointment.lockedFee,
        },
        payment: {
          id: result.payment.id,
          status: result.payment.status,
          amount: result.payment.amount,
        },
        token: {
          number: result.queueToken.tokenNumber,
        },
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation (another booking took the slot)
        throw errors.SLOT_NOT_AVAILABLE();
      }
      throw error;
    }
  },

  /**
   * Get patient's appointments
   */
  async getPatientAppointments(
    patientId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const offset = (page - 1) * limit;

    const where: any = { patientId };
    if (status) {
      where.status = status;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctorProfile: {
            include: {
              user: { select: { name: true } },
              currentStatus: true,
            },
          },
          clinic: { select: { name: true, city: true } },
          payment: true,
          refund: true,
          queueToken: true,
          review: true,
        },
        orderBy: { scheduledStart: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      items: appointments.map((a) => ({
        id: a.id,
        doctorName: a.doctorProfile.user.name,
        doctorStatus: a.doctorProfile.currentStatus?.status || 'OFFLINE',
        clinicName: a.clinic.name,
        clinicCity: a.clinic.city,
        consultationMode: a.consultationMode,
        scheduledStart: a.scheduledStart.toISOString(),
        scheduledEnd: a.scheduledEnd.toISOString(),
        reason: a.reason,
        status: a.status,
        lockedFee: a.lockedFee,
        paymentStatus: a.payment?.status,
        refundStatus: a.refund?.status,
        queueTokenNumber: a.queueToken?.tokenNumber,
        reviewed: !!a.review,
      })),
      total,
      page,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get appointment details
   */
  async getAppointmentDetails(appointmentId: string, userId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientUser: { select: { id: true, name: true } },
        doctorUser: { select: { id: true, name: true } },
        doctorProfile: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            currentStatus: true,
          },
        },
        clinic: true,
        payment: true,
        refund: { include: { events: true } },
        queueToken: true,
        prescription: { include: { items: true } },
        review: true,
      },
    });

    if (!appointment) {
      throw errors.NOT_FOUND('Appointment');
    }

    // Check authorization
    if (
      appointment.patientUserId !== userId &&
      appointment.doctorUserId !== userId
    ) {
      throw errors.FORBIDDEN();
    }

    return {
      id: appointment.id,
      doctor: {
        id: appointment.doctorProfile.id,
        name: appointment.doctorProfile.user.name,
        email: appointment.doctorProfile.user.email,
        phone: appointment.doctorProfile.user.phone,
        status: appointment.doctorProfile.currentStatus?.status,
      },
      clinic: {
        id: appointment.clinic.id,
        name: appointment.clinic.name,
        address: appointment.clinic.address,
        city: appointment.clinic.city,
        phone: appointment.clinic.phone,
      },
      patient: {
        id: appointment.patientUser.id,
        name: appointment.patientUser.name,
      },
      consultationMode: appointment.consultationMode,
      reason: appointment.reason,
      symptoms: appointment.symptoms,
      scheduledStart: appointment.scheduledStart.toISOString(),
      scheduledEnd: appointment.scheduledEnd.toISOString(),
      actualStart: appointment.actualStart?.toISOString(),
      actualEnd: appointment.actualEnd?.toISOString(),
      lockedFee: appointment.lockedFee,
      feeVersion: appointment.feeVersion,
      status: appointment.status,
      payment: appointment.payment ? {
        id: appointment.payment.id,
        status: appointment.payment.status,
        amount: appointment.payment.amount,
      } : null,
      refund: appointment.refund ? {
        id: appointment.refund.id,
        status: appointment.refund.status,
        amount: appointment.refund.amount,
        destination: appointment.refund.destination,
        events: appointment.refund.events,
      } : null,
      queueToken: appointment.queueToken ? {
        number: appointment.queueToken.tokenNumber,
        status: appointment.queueToken.status,
        position: appointment.queueToken.position,
      } : null,
      prescription: appointment.prescription ? {
        id: appointment.prescription.id,
        notes: appointment.prescription.notes,
        items: appointment.prescription.items,
      } : null,
      consultationNotes: appointment.consultationNotes,
      review: appointment.review ? {
        rating: appointment.review.rating,
        comment: appointment.review.comment,
      } : null,
    };
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    userId: string,
    reason: string,
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw errors.NOT_FOUND('Appointment');
    }

    if (
      appointment.patientUserId !== userId &&
      appointment.doctorUserId !== userId
    ) {
      throw errors.FORBIDDEN();
    }

    if (
      ![
        'BOOKED',
        'CONFIRMED',
        'CHECKED_IN',
      ].includes(appointment.status)
    ) {
      throw new Error('Appointment cannot be cancelled in current status');
    }

    const result = await db.cancelAppointmentWithRefund(
      appointmentId,
      userId,
      reason,
    );

    logger.info(`Appointment cancelled: ${appointmentId}`);

    return {
      appointment: {
        id: result.appointment.id,
        status: result.appointment.status,
      },
      refund: result.refund ? {
        id: result.refund.id,
        status: result.refund.status,
        amount: result.refund.amount,
      } : null,
    };
  },

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    userId: string,
    newSlotId: string,
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw errors.NOT_FOUND('Appointment');
    }

    if (appointment.patientUserId !== userId) {
      throw errors.FORBIDDEN();
    }

    const newSlot = await prisma.timeSlot.findUnique({
      where: { id: newSlotId },
    });

    if (!newSlot || newSlot.status !== 'AVAILABLE') {
      throw errors.SLOT_NOT_AVAILABLE();
    }

    // Transactional reschedule
    const result = await prisma.$transaction(async (tx) => {
      // Release old slot
      await tx.timeSlot.update({
        where: { id: appointment.slotId },
        data: { status: 'AVAILABLE' },
      });

      // Book new slot
      await tx.timeSlot.update({
        where: { id: newSlotId },
        data: { status: 'BOOKED' },
      });

      // Update appointment
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          slotId: newSlotId,
          scheduledStart: newSlot.startTime,
          scheduledEnd: newSlot.endTime,
          status: 'CONFIRMED',
        },
      });

      return updated;
    });

    logger.info(`Appointment rescheduled: ${appointmentId}`);

    return {
      id: result.id,
      scheduledStart: result.scheduledStart.toISOString(),
      scheduledEnd: result.scheduledEnd.toISOString(),
      status: result.status,
    };
  },

  /**
   * Get doctor's appointments for a specific date
   */
  async getDoctorAppointments(
    doctorId: string,
    date?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const offset = (page - 1) * limit;

    const where: any = { doctorId };

    // If date is provided, filter for that day
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00Z`);
      const endOfDay = new Date(`${date}T23:59:59Z`);
      where.scheduledStart = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patientUser: { select: { id: true, name: true, phone: true } },
          patient: { select: { id: true } },
          clinic: { select: { id: true, name: true } },
          payment: { select: { status: true } },
          queueToken: { select: { tokenNumber: true, position: true, status: true } },
        },
        orderBy: { scheduledStart: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      items: appointments.map((a) => ({
        id: a.id,
        patientName: a.patientUser.name,
        patientPhone: a.patientUser.phone,
        clinicName: a.clinic.name,
        consultationMode: a.consultationMode,
        reason: a.reason,
        scheduledStart: a.scheduledStart.toISOString(),
        scheduledEnd: a.scheduledEnd.toISOString(),
        status: a.status,
        lockedFee: a.lockedFee,
        paymentStatus: a.payment?.status || 'PENDING',
        queueToken: a.queueToken?.tokenNumber,
        queuePosition: a.queueToken?.position,
        queueStatus: a.queueToken?.status,
      })),
      total,
      page,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },
};
