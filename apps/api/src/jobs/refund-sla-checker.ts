import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

/**
 * Scheduled job to monitor refund SLA breaches
 * Runs every 5 minutes to check for refunds stuck in PROCESSING
 * Auto-escalates if SLA threshold exceeded (4 hours)
 */
export async function checkRefundSLABreachers() {
  try {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    // Find refunds in PROCESSING for more than 4 hours
    const breachedRefunds = await prisma.refund.findMany({
      where: {
        status: 'PROCESSING',
        updatedAt: {
          lt: fourHoursAgo,
        },
      },
      include: {
        appointment: {
          include: {
            patient: true,
            patientUser: true,
          },
        },
      },
    });

    for (const refund of breachedRefunds) {
      logger.warn('Refund SLA breached', {
        refundId: refund.id,
        appointmentId: refund.appointmentId,
        duration: Math.round((Date.now() - refund.updatedAt.getTime()) / 60000),
      });

      // Mark as SLA breached
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          slaBreached: true,
        },
      });

      // Create escalation ticket for admin
      await prisma.supportTicket.create({
        data: {
          createdByUserId: refund.appointment.patientUserId,
          status: 'WAITING_FOR_AGENT',
          priority: 'HIGH',
          category: 'REFUND',
          conversationId: (await prisma.chatConversation.create({
            data: {
              userId: refund.appointment.patientUserId,
            },
          })).id,
        },
      });

      logger.info('Refund SLA breach ticket created', { refundId: refund.id });
    }

    logger.debug('Refund SLA check completed', { breachedCount: breachedRefunds.length });
  } catch (error) {
    logger.error('Refund SLA check failed', { error });
  }
}

/**
 * Scheduled job to auto-credit wallets for approved refunds
 * Runs every 2 minutes to process APPROVED refunds
 */
export async function processApprovedRefunds() {
  try {
    const approvedRefunds = await prisma.refund.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        appointment: {
          include: {
            patient: true,
          },
        },
      },
    });

    for (const refund of approvedRefunds) {
      // Update refund status to PROCESSING
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'PROCESSING',
        },
      });

      // Credit wallet
      await prisma.wallet.upsert({
        where: { userId: refund.appointment.patientUserId },
        create: {
          userId: refund.appointment.patientUserId,
          balance: refund.amount,
        },
        update: {
          balance: {
            increment: refund.amount,
          },
        },
      });

      // Mark as CREDITED
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'CREDITED',
          creditedAt: new Date(),
        },
      });

      logger.info('Refund processed and credited', {
        refundId: refund.id,
        amount: refund.amount,
        patientId: refund.appointment.patientUserId,
      });

      // TODO: Send notification via Socket.IO
    }
  } catch (error) {
    logger.error('Process approved refunds job failed', { error });
  }
}
