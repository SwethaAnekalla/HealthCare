import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

/**
 * Scheduled job to handle no-show appointments
 * Grace period: 15 minutes after appointment time
 * Action: Auto-refund, mark as no-show
 */
export async function handleNoShowAppointments() {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Find appointments that should have started but no check-in
    const noShowAppointments = await prisma.appointment.findMany({
      where: {
        status: 'BOOKED',
        scheduledStart: {
          lt: fifteenMinutesAgo,
        },
        // No queue token means no check-in
        queueToken: null,
      },
      include: {
        patient: true,
        doctorProfile: true,
      },
    });

    for (const appointment of noShowAppointments) {
      logger.warn('No-show appointment detected', {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      });

      // Update appointment status
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'NO_SHOW',
        },
      });

      // Auto-refund (if payment was made)
      const payment = await prisma.payment.findUnique({
        where: { appointmentId: appointment.id },
      });

      if (payment && payment.status === 'SUCCESS') {
        await prisma.refund.create({
          data: {
            appointmentId: appointment.id,
            paymentId: payment.id,
            amount: payment.amount,
            status: 'APPROVED', // Auto-approve no-show refunds
            destination: 'WALLET',
            slaExpectedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            events: {
              create: {
                status: 'APPROVED',
                message: 'No-show refund auto-approved',
              },
            },
          },
        });

        logger.info('No-show refund created', {
          appointmentId: appointment.id,
          amount: payment.amount,
        });
      }
    }

    logger.debug('No-show check completed', { count: noShowAppointments.length });
  } catch (error) {
    logger.error('No-show handler failed', { error });
  }
}

/**
 * Scheduled job to recalculate queue ETAs
 * Runs every minute to update ETA based on doctor's actual pace
 */
export async function updateQueueETAs() {
  try {
    // Get all active queue tokens
    const activeTokens = await prisma.queueToken.findMany({
      where: {
        status: 'ISSUED',
      },
      include: {
        appointment: {
          include: {
            doctorProfile: true,
          },
        },
      },
    });

    for (const token of activeTokens) {
      // Get doctor's average consultation time (last 10 completed)
      const completedAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: token.appointment.doctorId,
          status: 'COMPLETED',
          actualEnd: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: {
          actualEnd: 'desc',
        },
        take: 10,
      });

      let avgConsultationTime = 10; // Default 10 minutes
      if (completedAppointments.length > 0) {
        const totalTime = completedAppointments.reduce((sum, apt) => {
          if (apt.actualEnd && apt.actualStart) {
            return sum + (apt.actualEnd.getTime() - apt.actualStart.getTime());
          }
          return sum;
        }, 0);
        avgConsultationTime = Math.round(totalTime / completedAppointments.length / 60000);
      }

      // Get position in queue
      const position = await prisma.queueToken.count({
        where: {
          session: {
            doctorId: token.appointment.doctorId,
          },
          status: 'ISSUED',
          createdAt: {
            lte: token.createdAt,
          },
        },
      });

      // Update queue token with calculated position
      await prisma.queueToken.update({
        where: { id: token.id },
        data: {
          position: position,
          updatedAt: new Date(),
        },
      });

      logger.debug('Queue position updated', {
        tokenId: token.id,
        position,
        avgTime: avgConsultationTime,
      });
    }

    logger.debug('Queue position update completed', { count: activeTokens.length });
  } catch (error) {
    logger.error('Queue position update failed', { error });
  }
}

/**
 * Scheduled job to auto-complete queues that are inactive
 * Cleans up stale queue tokens after appointment time + 2 hours
 */
export async function cleanupStaleQueues() {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const staleTokens = await prisma.queueToken.findMany({
      where: {
        status: 'ISSUED',
        updatedAt: {
          lt: twoHoursAgo,
        },
      },
    });

    for (const token of staleTokens) {
      await prisma.queueToken.update({
        where: { id: token.id },
        data: {
          status: 'ABANDONED',
        },
      });

      logger.info('Stale queue token cleaned up', { tokenId: token.id });
    }

    logger.debug('Cleanup stale queues completed', { count: staleTokens.length });
  } catch (error) {
    logger.error('Cleanup stale queues failed', { error });
  }
}

/**
 * Scheduled job to log doctor status changes
 * Logs status changes in history table
 */
export async function propagateDoctorStatusChanges() {
  try {
    // This is typically event-driven, but can be used to catch any missed updates
    // Get recent status history
    const recentHistory = await prisma.doctorStatusHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      distinct: ['doctorId'],
    });

    for (const history of recentHistory) {
      const currentStatus = await prisma.doctorStatus.findUnique({
        where: { doctorId: history.doctorId },
      });

      if (currentStatus && currentStatus.status !== history.status) {
        logger.warn('Doctor status mismatch detected', {
          doctorId: history.doctorId,
          currentStatus: currentStatus.status,
          lastRecordedStatus: history.status,
        });
      }
    }

    logger.debug('Doctor status propagation completed');
  } catch (error) {
    logger.error('Doctor status propagation failed', { error });
  }
}
