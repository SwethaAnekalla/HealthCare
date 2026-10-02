import { prisma } from '../../lib/prisma';
import { errors } from '../../lib/error';
import { logger } from '../../lib/logger';
export const pricingService = {
  /**
   * Get current fee for a doctor
   */
  async getDoctorFee(doctorId: string, clinicId: string) {
    const fee = await prisma.fee.findFirst({
      where: {
        doctorId,
        clinicId,
      },
      orderBy: { version: 'desc' },
    });
    if (!fee) {
      throw errors.NOT_FOUND('Consultation fee not set');
    }
    return {
      id: fee.id,
      amount: fee.amount,
      version: fee.version,
      effectiveFrom: fee.effectiveFrom.toISOString(),
    };
  },

  /**
   * **FEATURE 6A: Get actual fee and check for price mismatch**
   */
  async getFeeWithPriceMatch(doctorId: string, clinicId: string, patientSeenPrice?: number) {
    const fee = await prisma.fee.findFirst({
      where: {
        doctorId,
        clinicId,
      },
      orderBy: { version: 'desc' },
    });
    if (!fee) {
      throw errors.NOT_FOUND('Consultation fee not set');
    }

    // Check if there's a price mismatch
    let priceDiscrepancy = null;
    if (patientSeenPrice !== undefined && patientSeenPrice !== fee.amount) {
      priceDiscrepancy = {
        patientSeenPrice,
        actualPrice: fee.amount,
        difference: Math.abs(patientSeenPrice - fee.amount),
        direction: patientSeenPrice > fee.amount ? 'HIGHER' : 'LOWER',
      };
      logger.warn(
        `Price mismatch detected: Doctor ${doctorId}, Clinic ${clinicId}, Seen: ${patientSeenPrice}, Actual: ${fee.amount}`
      );
    }

    return {
      id: fee.id,
      amount: fee.amount,
      version: fee.version,
      effectiveFrom: fee.effectiveFrom.toISOString(),
      priceDiscrepancy,
    };
  },

  /**
   * Update fee (doctor or admin)
   */
  async updateFee(doctorId: string, clinicId: string, newAmount: number, changedBy: string) {
    // Get current fee
    const currentFee = await prisma.fee.findFirst({
      where: {
        doctorId,
        clinicId,
      },
      orderBy: { version: 'desc' },
    });
    if (!currentFee) {
      throw errors.NOT_FOUND('Current fee not found');
    }
    // Create new fee version
    const fee = await prisma.$transaction(async (tx) => {
      // Record history
      await tx.feeHistory.create({
        data: {
          feeId: currentFee.id,
          doctorId,
          clinicId,
          amount: currentFee.amount,
          version: currentFee.version,
          changedBy,
          changedAt: new Date(),
        },
      });
      // Update existing fee
      return await tx.fee.update({
        where: { id: currentFee.id },
        data: {
          amount: newAmount,
          version: currentFee.version + 1,
          changedBy,
        },
      });
    });
    logger.info(`Fee updated for doctor ${doctorId}: ${currentFee.amount} → ${newAmount}`);
    return {
      id: fee.id,
      amount: fee.amount,
      version: fee.version,
      previousAmount: currentFee.amount,
    };
  },
  /**
   * Get fee history
   */
  async getFeeHistory(doctorId: string, clinicId: string) {
    const history = await prisma.feeHistory.findMany({
      where: {
        doctorId,
        clinicId,
      },
      orderBy: { changedAt: 'desc' },
    });
    return history.map((h) => ({
      id: h.id,
      amount: h.amount,
      version: h.version,
      changedAt: h.changedAt.toISOString(),
      changedBy: h.changedBy,
    }));
  },
  /**
   * Report price dispute
   */
  async reportPriceDispute(
    appointmentId: string,
    reportedBy: string,
    claimedAmount: number,
    evidenceUrls: string[],
    description: string,
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw errors.NOT_FOUND('Appointment');
    }
    if (appointment.patientUserId !== reportedBy) {
      throw errors.FORBIDDEN();
    }
    // Create dispute
    const dispute = await prisma.priceDispute.create({
      data: {
        appointmentId,
        reportedByUserId: reportedBy,
        lockedFee: appointment.lockedFee,
        claimedAmount,
        evidenceUrls: JSON.stringify(evidenceUrls), // Store as JSON string
        description,
        status: 'OPEN',
      },
    });
    logger.info(`Price dispute reported: ${dispute.id}`);
    return {
      id: dispute.id,
      status: dispute.status,
      lockedFee: dispute.lockedFee,
      claimedAmount: dispute.claimedAmount,
      createdAt: dispute.createdAt.toISOString(),
    };
  },

  /**
   * **FEATURE 6B: Verify and detect price mismatch automatically**
   */
  async checkAndReportPriceMismatch(appointmentId: string, patientSeenPrice: number) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctorProfile: { select: { id: true } },
      },
    });
    if (!appointment) {
      throw errors.NOT_FOUND('Appointment');
    }

    // Get actual fee at booking time
    const actualFee = await prisma.fee.findFirst({
      where: {
        doctorId: appointment.doctorProfile.id,
        clinicId: appointment.clinicId,
      },
      orderBy: { version: 'desc' },
    });

    if (!actualFee) {
      throw errors.NOT_FOUND('Fee information not found');
    }

    // Check for mismatch
    if (patientSeenPrice !== actualFee.amount) {
      // Auto-create dispute
      const dispute = await prisma.priceDispute.create({
        data: {
          appointmentId,
          reportedByUserId: appointment.patientUserId,
          lockedFee: appointment.lockedFee,
          claimedAmount: patientSeenPrice,
          description: `Automatic price mismatch detection. Patient saw ₹${patientSeenPrice}, actual fee was ₹${actualFee.amount}`,
          status: 'OPEN',
        },
      });

      logger.warn(`Automatic price dispute created: ${dispute.id}`);
      return {
        mismatchDetected: true,
        disputeId: dispute.id,
        difference: Math.abs(patientSeenPrice - actualFee.amount),
      };
    }

    return { mismatchDetected: false };
  },

  /**
   * Get price disputes (admin)
   */
  async getPriceDisputes(status?: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const where: any = {};
    if (status) {
      where.status = status;
    }
    const [disputes, total] = await Promise.all([
      prisma.priceDispute.findMany({
        where,
        include: {
          appointment: {
            select: {
              id: true,
              doctorProfile: { select: { id: true, user: { select: { name: true } } } },
              clinic: { select: { name: true } },
            },
          },
          reportedByUser: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.priceDispute.count({ where }),
    ]);
    return {
      items: disputes.map((d) => ({
        id: d.id,
        appointmentId: d.appointmentId,
        doctorName: d.appointment.doctorProfile.user.name,
        clinicName: d.appointment.clinic.name,
        lockedFee: d.lockedFee,
        claimedAmount: d.claimedAmount,
        difference: d.claimedAmount - d.lockedFee,
        status: d.status,
        reportedBy: d.reportedByUser.name,
        createdAt: d.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },
  /**
   * Resolve price dispute (admin)
   */
  async resolvePriceDispute(
    disputeId: string,
    approved: boolean,
    resolution: string,
  ) {
    const dispute = await prisma.priceDispute.findUnique({
      where: { id: disputeId },
      include: { appointment: true },
    });
    if (!dispute) {
      throw errors.NOT_FOUND('Dispute');
    }
    const status = approved ? 'APPROVED' : 'REJECTED';
    let refund: any = null;
    // If approved, create refund for the difference
    if (approved && dispute.claimedAmount < dispute.lockedFee) {
      const refundAmount = dispute.lockedFee - dispute.claimedAmount;
      refund = await prisma.refund.create({
        data: {
          appointmentId: dispute.appointmentId,
          paymentId: dispute.appointment.paymentId!,
          amount: refundAmount,
          status: 'APPROVED',
          destination: 'WALLET',
          slaExpectedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          approvedAt: new Date(),
          events: {
            create: {
              status: 'APPROVED',
              message: `Price dispute resolution: Refunding ${refundAmount} paise`,
            },
          },
        },
      });
    }
    const updated = await prisma.priceDispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolution,
        refundId: refund?.id,
        refundAmount: refund?.amount,
        clinicPenaltyApplied: approved,
      },
    });
    logger.info(`Price dispute resolved: ${disputeId} - ${status}`);
    return {
      id: updated.id,
      status: updated.status,
      refund: refund ? {
        id: refund.id,
        amount: refund.amount,
      } : null,
    };
  },
};
