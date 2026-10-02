import { prisma } from '../../lib/prisma';
import { errors } from '../../lib/error';
import { logger } from '../../lib/logger';
import { db } from '../../lib/db';

export const refundsService = {
  /**
   * Get refund with full lifecycle
   */
  async getRefund(refundId: string) {
    const refund = await db.getRefundWithEvents(refundId);
    if (!refund) {
      throw errors.NOT_FOUND('Refund');
    }
    return {
      id: refund.id,
      appointmentId: refund.appointmentId,
      amount: refund.amount,
      status: refund.status,
      destination: refund.destination,
      requestedAt: refund.requestedAt.toISOString(),
      approvedAt: refund.approvedAt?.toISOString(),
      processedAt: refund.processedAt?.toISOString(),
      creditedAt: refund.creditedAt?.toISOString(),
      slaExpectedAt: refund.slaExpectedAt.toISOString(),
      slaBreached: refund.slaBreached,
      failureReason: refund.failureReason,
      events: refund.events.map((e) => ({
        id: e.id,
        status: e.status,
        message: e.message,
        createdAt: e.createdAt.toISOString(),
      })),
      appointment: refund.appointment ? {
        id: refund.appointment.id,
        patientName: refund.appointment.patientUser.name,
        doctorName: refund.appointment.doctorUser.name,
      } : null,
    };
  },
  /**
   * Get all refunds for a patient
   */
  async getPatientRefunds(patientId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where: {
          appointment: {
            patientId,
          },
        },
        include: {
          appointment: {
            select: { id: true, scheduledStart: true },
          },
          events: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.refund.count({
        where: {
          appointment: {
            patientId,
          },
        },
      }),
    ]);
    return {
      items: refunds.map((r) => ({
        id: r.id,
        appointmentId: r.appointmentId,
        amount: r.amount,
        status: r.status,
        destination: r.destination,
        requestedAt: r.requestedAt.toISOString(),
        creditedAt: r.creditedAt?.toISOString(),
        slaBreached: r.slaBreached,
        eventCount: r.events.length,
      })),
      total,
      page,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },
  /**
   * Approve refund (admin)
   */
  async approveRefund(refundId: string, approvedBy: string) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { appointment: { select: { patientUserId: true } } },
    });
    if (!refund) {
      throw errors.NOT_FOUND('Refund');
    }
    if (refund.status !== 'REQUESTED') {
      throw new Error('Refund can only be approved from REQUESTED status');
    }
    const updated = await prisma.$transaction(async (tx) => {
      // Update refund
      const r = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });
      // Add event
      await tx.refundEvent.create({
        data: {
          refundId,
          status: 'APPROVED',
          message: 'Refund approved by admin',
          createdBy: approvedBy,
        },
      });
      return r;
    });
    
    // **FEATURE 3A: EMIT REFUND_STATUS_CHANGED EVENT**
    try {
      const realtimeGateway = (global as any).realtimeGateway;
      if (realtimeGateway && refund.appointment) {
        realtimeGateway.notifyRefundApproved(refund.appointment.patientUserId, refundId, refund.amount);
        logger.debug(`Refund approved event emitted for ${refundId}`);
      }
    } catch (err) {
      logger.error('Failed to emit refund approved event', { error: err });
    }
    
    logger.info(`Refund approved: ${refundId}`);
    return {
      id: updated.id,
      status: updated.status,
      approvedAt: updated.approvedAt?.toISOString(),
    };
  },
  /**
   * Process refund (move to processing)
   */
  async processRefund(refundId: string) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { appointment: { select: { patientUserId: true } } },
    });
    if (!refund) {
      throw errors.NOT_FOUND('Refund');
    }
    if (refund.status !== 'APPROVED') {
      throw new Error('Refund can only be processed from APPROVED status');
    }
    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'PROCESSING',
          processedAt: new Date(),
        },
      });
      await tx.refundEvent.create({
        data: {
          refundId,
          status: 'PROCESSING',
          message: 'Refund is being processed',
        },
      });
      return r;
    });
    
    // **FEATURE 3B: EMIT REFUND_STATUS_CHANGED EVENT**
    try {
      const realtimeGateway = (global as any).realtimeGateway;
      if (realtimeGateway && refund.appointment) {
        realtimeGateway.notifyUser(refund.appointment.patientUserId, {
          type: 'REFUND_PROCESSING',
          title: 'Refund Processing',
          message: `Your refund of ₹${refund.amount} is now being processed.`,
          refundId,
          actionUrl: `/refunds/${refundId}`,
        });
        logger.debug(`Refund processing event emitted for ${refundId}`);
      }
    } catch (err) {
      logger.error('Failed to emit refund processing event', { error: err });
    }
    
    logger.info(`Refund processing: ${refundId}`);
    return { id: updated.id, status: updated.status };
  },
  /**
   * Credit refund (instant to wallet or scheduled to payment method)
   */
  async creditRefund(refundId: string) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { appointment: { select: { patientUserId: true } } },
    });
    if (!refund) {
      throw errors.NOT_FOUND('Refund');
    }
    if (refund.status !== 'PROCESSING') {
      throw new Error('Refund can only be credited from PROCESSING status');
    }
    const updated = await prisma.$transaction(async (tx) => {
      // If wallet destination, credit immediately
      if (refund.destination === 'WALLET') {
        const wallet = await tx.wallet.findUnique({
          where: { userId: refund.appointment.patientUserId },
        });
        if (wallet) {
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'CREDIT',
              amount: refund.amount,
              reason: 'Appointment cancellation refund',
              reference: refundId,
            },
          });
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: {
                increment: refund.amount,
              },
            },
          });
        }
      }
      // Update refund
      const r = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'CREDITED',
          creditedAt: new Date(),
          slaBreached: new Date() > refund.slaExpectedAt,
        },
      });
      await tx.refundEvent.create({
        data: {
          refundId,
          status: 'CREDITED',
          message: `Refund credited to ${refund.destination.toLowerCase().replace(/_/g, ' ')}`,
        },
      });
      return r;
    });
    
    // **FEATURE 3C: EMIT REFUND_STATUS_CHANGED EVENT**
    try {
      const realtimeGateway = (global as any).realtimeGateway;
      if (realtimeGateway && refund.appointment) {
        realtimeGateway.notifyRefundCredited(refund.appointment.patientUserId, refundId, refund.amount);
        logger.debug(`Refund credited event emitted for ${refundId}`);
      }
    } catch (err) {
      logger.error('Failed to emit refund credited event', { error: err });
    }
    
    logger.info(`Refund credited: ${refundId}`);
    return {
      id: updated.id,
      status: updated.status,
      creditedAt: updated.creditedAt?.toISOString(),
      slaBreached: updated.slaBreached,
    };
  },
  /**
   * Reject refund (admin)
   */
  async rejectRefund(refundId: string, rejectedBy: string, reason: string) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { appointment: { select: { patientUserId: true } } },
    });
    if (!refund) {
      throw errors.NOT_FOUND('Refund');
    }
    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'REJECTED',
          rejectedBy,
          rejectionReason: reason,
        },
      });
      await tx.refundEvent.create({
        data: {
          refundId,
          status: 'REJECTED',
          message: `Refund rejected: ${reason}`,
          createdBy: rejectedBy,
        },
      });
      return r;
    });
    
    // **FEATURE 3D: EMIT REFUND_STATUS_CHANGED EVENT**
    try {
      const realtimeGateway = (global as any).realtimeGateway;
      if (realtimeGateway && refund.appointment) {
        realtimeGateway.notifyUser(refund.appointment.patientUserId, {
          type: 'REFUND_REJECTED',
          title: 'Refund Rejected',
          message: `Your refund request has been rejected. Reason: ${reason}`,
          refundId,
          actionUrl: `/refunds/${refundId}`,
        });
        logger.debug(`Refund rejected event emitted for ${refundId}`);
      }
    } catch (err) {
      logger.error('Failed to emit refund rejected event', { error: err });
    }
    
    logger.info(`Refund rejected: ${refundId}`);
    return {
      id: updated.id,
      status: updated.status,
      rejectionReason: updated.rejectionReason,
    };
  },
  /**
   * Check for SLA breaches and flag them
   */
  async checkSLABreaches() {
    const now = new Date();
    const breachedRefunds = await prisma.refund.findMany({
      where: {
        slaBreached: false,
        status: { in: ['REQUESTED', 'APPROVED', 'PROCESSING'] },
        slaExpectedAt: { lt: now },
      },
    });
    for (const refund of breachedRefunds) {
      await prisma.refund.update({
        where: { id: refund.id },
        data: { slaBreached: true },
      });
      await prisma.refundEvent.create({
        data: {
          refundId: refund.id,
          status: refund.status,
          message: 'SLA breach: Refund not completed within expected timeframe',
        },
      });
      logger.warn(`Refund SLA breached: ${refund.id}`);
    }
    return breachedRefunds.length;
  },
};
