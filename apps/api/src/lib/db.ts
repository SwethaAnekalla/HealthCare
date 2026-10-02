import { prisma } from './prisma';

/**
 * Helper functions for database operations
 */

export const db = {
  /**
   * Check if a slot is available and hold it for booking
   */
  async holdSlot(slotId: string, expirationSeconds: number = 600) {
    const slot = await prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        status: 'HELD',
        holdExpiresAt: new Date(Date.now() + expirationSeconds * 1000),
      },
    });
    return slot;
  },

  /**
   * Release a held slot
   */
  async releaseSlot(slotId: string) {
    const slot = await prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        status: 'AVAILABLE',
        holdExpiresAt: null,
      },
    });
    return slot;
  },

  /**
   * Get available slots for a doctor on a specific date
   */
  async getAvailableSlots(doctorId: string, clinicId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await prisma.timeSlot.findMany({
      where: {
        doctorId,
        clinicId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['AVAILABLE', 'HELD'],
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return slots.filter((slot) => {
      // Filter out expired holds
      if (slot.status === 'HELD' && slot.holdExpiresAt && slot.holdExpiresAt < new Date()) {
        return false;
      }
      return true;
    });
  },

  /**
   * Create appointment with transaction (prevents double-booking)
   */
  async createAppointmentTransactional(appointmentData: any, paymentData: any) {
    return await prisma.$transaction(async (tx) => {
      // Update slot to BOOKED
      await tx.timeSlot.update({
        where: { id: appointmentData.slotId },
        data: { status: 'BOOKED' },
      });

      // Create appointment
      const appointment = await tx.appointment.create({
        data: appointmentData,
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          ...paymentData,
          appointmentId: appointment.id,
        },
      });

      // Create queue session if not exists
      const queueSession = await tx.queueSession.upsert({
        where: {
          doctorId_clinicId_date: {
            doctorId: appointment.doctorId,
            clinicId: appointment.clinicId,
            date: appointment.scheduledStart.toISOString().split('T')[0],
          },
        },
        create: {
          doctorId: appointment.doctorId,
          clinicId: appointment.clinicId,
          date: appointment.scheduledStart.toISOString().split('T')[0],
          status: 'ACTIVE',
          totalTokensIssued: 1,
        },
        update: {
          totalTokensIssued: {
            increment: 1,
          },
        },
      });

      // Create queue token
      const queueToken = await tx.queueToken.create({
        data: {
          appointmentId: appointment.id,
          sessionId: queueSession.id,
          tokenNumber: queueSession.totalTokensIssued,
          status: 'ISSUED',
        },
      });

      return { appointment, payment, queueToken };
    });
  },

  /**
   * Cancel appointment and trigger refund
   */
  async cancelAppointmentWithRefund(
    appointmentId: string,
    cancelledBy: string,
    reason: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      // Update appointment
      const appointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          cancelledBy,
          cancellationReason: reason,
          cancellationTimestamp: new Date(),
        },
      });

      // Release slot
      const slot = await tx.timeSlot.findUnique({
        where: { id: appointment.slotId },
      });

      if (slot) {
        await tx.timeSlot.update({
          where: { id: slot.id },
          data: {
            status: 'AVAILABLE',
          },
        });
      }

      // Get payment
      const payment = await tx.payment.findUnique({
        where: { appointmentId },
      });

      if (payment && payment.status === 'SUCCESS') {
        // Create refund
        const refund = await tx.refund.create({
          data: {
            appointmentId,
            paymentId: payment.id,
            amount: payment.amount,
            status: 'REQUESTED',
            destination: 'WALLET',
            slaExpectedAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours SLA
            events: {
              create: {
                status: 'REQUESTED',
                message: `Refund requested due to: ${reason}`,
              },
            },
          },
        });

        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });

        return { appointment, refund };
      }

      return { appointment };
    });
  },

  /**
   * Get doctor's current status
   */
  async getDoctorStatus(doctorId: string) {
    return await prisma.doctorStatus.findUnique({
      where: { doctorId },
    });
  },

  /**
   * Update doctor status and log history
   */
  async updateDoctorStatus(
    doctorId: string,
    statusData: any,
    setByUserId: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      // Log history
      await tx.doctorStatusHistory.create({
        data: {
          doctorId,
          status: statusData.status,
          delayMinutes: statusData.delayMinutes,
          reason: statusData.reason,
          leaveStartDate: statusData.leaveStartDate,
          leaveEndDate: statusData.leaveEndDate,
          setByUserId,
        },
      });

      // Update current status
      const status = await tx.doctorStatus.upsert({
        where: { doctorId },
        create: {
          doctorId,
          status: statusData.status,
          delayMinutes: statusData.delayMinutes,
          reason: statusData.reason,
          leaveStartDate: statusData.leaveStartDate,
          leaveEndDate: statusData.leaveEndDate,
          setByUserId,
        },
        update: {
          status: statusData.status,
          delayMinutes: statusData.delayMinutes,
          reason: statusData.reason,
          leaveStartDate: statusData.leaveStartDate,
          leaveEndDate: statusData.leaveEndDate,
          updatedAt: new Date(),
        },
      });

      return status;
    });
  },

  /**
   * Get refund with all events
   */
  async getRefundWithEvents(refundId: string) {
    return await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
        appointment: {
          include: {
            patientUser: true,
            doctorUser: true,
          },
        },
      },
    });
  },

  /**
   * Get queue session with all tokens
   */
  async getQueueSessionWithTokens(
    doctorId: string,
    clinicId: string,
    date: string,
  ) {
    return await prisma.queueSession.findUnique({
      where: {
        doctorId_clinicId_date: {
          doctorId,
          clinicId,
          date,
        },
      },
      include: {
        tokens: {
          orderBy: { tokenNumber: 'asc' },
          include: {
            appointment: {
              include: {
                patientUser: true,
                doctorUser: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Calculate average consultation duration for a doctor
   */
  async calculateAveragePace(doctorId: string, daysBack: number = 7) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - daysBack);

    const metrics = await prisma.doctorPaceMetric.findMany({
      where: {
        doctorId,
        createdAt: {
          gte: pastDate,
        },
      },
    });

    if (metrics.length === 0) return 600; // Default to 10 minutes

    const totalDuration = metrics.reduce((sum, m) => sum + m.consultationDuration, 0);
    return Math.round(totalDuration / metrics.length);
  },
};
