import { prisma } from '../../lib/prisma';
import { db } from '../../lib/db';
import { errors } from '../../lib/error';
import { logger } from '../../lib/logger';
export const queueService = {
  /**
   * Check in patient and get token
   */
  async checkIn(
    appointmentId: string,
    userId: string,
    checkInType: 'ON_SITE' | 'REMOTE',
    latitude?: number,
    longitude?: number,
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { queueToken: true },
    });
    if (!appointment) {
      throw errors.NOT_FOUND('Appointment');
    }
    if (appointment.patientUserId !== userId) {
      throw errors.FORBIDDEN();
    }
    if (!appointment.queueToken) {
      throw new Error('No queue token for this appointment');
    }
    // Update token status
    const token = await prisma.queueToken.update({
      where: { id: appointment.queueToken.id },
      data: {
        status: 'IN_QUEUE',
        checkInType,
        checkInTime: new Date(),
      },
    });
    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CHECKED_IN' },
    });
    
    // **FEATURE 2A: EMIT QUEUE_CHECK_IN EVENT**
    try {
      const realtimeGateway = (global as any).realtimeGateway;
      if (realtimeGateway) {
        realtimeGateway.broadcastQueueUpdate({
          clinicId: appointment.clinicId,
          doctorId: appointment.doctorId,
          totalTokens: 1,
          updatedAt: new Date(),
        });
        logger.debug(`Queue check-in event emitted for appointment ${appointmentId}`);
      }
    } catch (err) {
      logger.error('Failed to emit queue check-in event', { error: err });
    }
    
    logger.info(`Patient checked in: ${appointmentId}`);
    return {
      tokenNumber: token.tokenNumber,
      status: token.status,
      checkInTime: token.checkInTime?.toISOString(),
    };
  },
  /**
   * Get queue position and ETA
   */
  async getQueuePosition(appointmentId: string, userId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        queueToken: true,
        doctorProfile: true,
      },
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
    if (!appointment.queueToken) {
      return {
        tokenNumber: null,
        position: null,
        eta: null,
        status: 'NOT_CHECKED_IN',
      };
    }
    // Get queue session
    const date = appointment.scheduledStart.toISOString().split('T')[0];
    const session = await db.getQueueSessionWithTokens(
      appointment.doctorId,
      appointment.clinicId,
      date,
    );
    if (!session) {
      return {
        tokenNumber: appointment.queueToken.tokenNumber,
        position: null,
        eta: null,
        status: appointment.queueToken.status,
      };
    }
    // Calculate position
    const currentToken = session.tokens.find((t) => t.id === appointment.queueToken!.id);
    const tokensAhead = session.tokens.filter(
      (t) => t.tokenNumber < currentToken!.tokenNumber && t.status !== 'COMPLETED' && t.status !== 'SKIPPED',
    ).length;
    
    // **FEATURE 2B: EMIT QUEUE POSITION WITH TOKENSAHEAD FOR POLLING**
    try {
      const realtimeGateway = (global as any).realtimeGateway;
      if (realtimeGateway) {
        const avgPace = await db.calculateAveragePace(appointment.doctorId);
        realtimeGateway.broadcastQueuePositionChange(
          appointmentId,
          appointment.clinicId,
          tokensAhead + 1,
          tokensAhead * avgPace / 60, // Convert to minutes
        );
      }
    } catch (err) {
      logger.error('Failed to emit queue position event', { error: err });
    }
    
    // Calculate ETA
    const avgPace = await db.calculateAveragePace(appointment.doctorId);
    const eta = new Date(Date.now() + tokensAhead * avgPace * 1000);
    return {
      tokenNumber: appointment.queueToken.tokenNumber,
      position: tokensAhead + 1,
      tokensAhead,
      eta: eta.toISOString(),
      status: appointment.queueToken.status,
      averagePaceSeconds: avgPace,
    };
  },
  /**
   * Get queue session with all tokens
   */
  async getQueueSession(doctorId: string, clinicId: string, date: string, userId: string) {
    // Verify authorization
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw errors.NOT_FOUND('Doctor');
    }
    const session = await db.getQueueSessionWithTokens(doctorId, clinicId, date);
    if (!session) {
      return {
        date,
        status: 'NOT_STARTED',
        tokens: [],
        totalTokens: 0,
        currentToken: null,
      };
    }
    return {
      date,
      status: session.status,
      totalTokens: session.totalTokensIssued,
      currentToken: session.currentTokenNumber,
      tokens: session.tokens.map((t) => ({
        id: t.id,
        number: t.tokenNumber,
        status: t.status,
        patientName: t.appointment.patientUser?.name,
        checkInTime: t.checkInTime?.toISOString(),
        startTime: t.startConsultationTime?.toISOString(),
        endTime: t.endConsultationTime?.toISOString(),
      })),
    };
  },
  /**
   * Doctor: call next patient
   */
  async callNextPatient(doctorId: string, clinicId: string, date: string) {
    const session = await prisma.queueSession.findUnique({
      where: {
        doctorId_clinicId_date: { doctorId, clinicId, date },
      },
      include: { tokens: { orderBy: { tokenNumber: 'asc' } } },
    });
    if (!session) {
      throw errors.NOT_FOUND('Queue session');
    }
    // Find next token in queue
    const nextToken = session.tokens.find(
      (t) => t.status === 'IN_QUEUE' || (t.status === 'ISSUED' && !t.checkInTime),
    );
    if (!nextToken) {
      return { message: 'No more patients in queue' };
    }
    // Update token
    const updated = await prisma.queueToken.update({
      where: { id: nextToken.id },
      data: {
        status: 'CALLED',
        position: session.currentTokenNumber ? session.currentTokenNumber + 1 : 1,
      },
    });
    // Update session current token
    await prisma.queueSession.update({
      where: { id: session.id },
      data: { currentTokenNumber: updated.tokenNumber },
    });
    
    // **FEATURE 2C: CHECK IF NEXT PATIENT IS 2 POSITIONS AWAY AND EMIT ALERT**
    try {
      // Find the token that's 2 positions away (next in line after current)
      const twoAway = session.tokens.find((t) => t.tokenNumber === updated.tokenNumber + 2);
      if (twoAway) {
        const realtimeGateway = (global as any).realtimeGateway;
        if (realtimeGateway) {
          realtimeGateway.io?.to(`queue:${clinicId}`).emit('queue:two-people-away', {
            appointmentId: twoAway.appointmentId,
            tokenNumber: twoAway.tokenNumber,
            currentToken: updated.tokenNumber,
            timestamp: new Date(),
          });
          logger.debug(`Two-people-away alert emitted for token ${twoAway.tokenNumber}`);
        }
      }
    } catch (err) {
      logger.error('Failed to emit two-people-away alert', { error: err });
    }
    
    logger.info(`Next patient called: Token #${updated.tokenNumber}`);
    return {
      tokenId: updated.id,
      tokenNumber: updated.tokenNumber,
    };
  },
  /**
   * Doctor: mark consultation as completed
   */
  async completeConsultation(
    appointmentId: string,
    doctorId: string,
    consultationNotes?: string,
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { queueToken: true },
    });
    if (!appointment) {
      throw errors.NOT_FOUND('Appointment');
    }
    if (appointment.doctorId !== doctorId) {
      throw errors.FORBIDDEN();
    }
    const now = new Date();
    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        actualStart: appointment.actualStart || now,
        actualEnd: now,
        consultationNotes,
      },
    });
    if (appointment.queueToken) {
      // Record pace metric
      const consultationDuration = appointment.queueToken.startConsultationTime
        ? Math.round(
            (now.getTime() - appointment.queueToken.startConsultationTime.getTime()) / 1000,
          )
        : 600; // Default 10 minutes
      await prisma.doctorPaceMetric.create({
        data: {
          doctorId,
          date: now.toISOString().split('T')[0],
          consultationDuration,
        },
      });
      // Update queue token
      await prisma.queueToken.update({
        where: { id: appointment.queueToken.id },
        data: {
          status: 'COMPLETED',
          endConsultationTime: now,
        },
      });
    }
    logger.info(`Consultation completed: ${appointmentId}`);
    return {
      appointmentId,
      status: 'COMPLETED',
      completedAt: now.toISOString(),
    };
  },
  /**
   * Doctor: mark patient as no-show
   */
  async markNoShow(appointmentId: string, doctorId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { queueToken: true },
    });
    if (!appointment) {
      throw errors.NOT_FOUND('Appointment');
    }
    if (appointment.doctorId !== doctorId) {
      throw errors.FORBIDDEN();
    }
    const now = new Date();
    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'NO_SHOW' },
    });
    if (appointment.queueToken) {
      await prisma.queueToken.update({
        where: { id: appointment.queueToken.id },
        data: {
          status: 'NO_SHOW',
          noShowGracePeriodExpiresAt: new Date(now.getTime() + 30 * 60 * 1000), // 30 min grace
        },
      });
    }
    logger.info(`Patient marked as no-show: ${appointmentId}`);
    return { appointmentId, status: 'NO_SHOW' };
  },
  /**
   * Get queue display (for waiting room TV)
   */
  async getQueueDisplay(clinicId: string, doctorId: string, date: string) {
    const session = await db.getQueueSessionWithTokens(doctorId, clinicId, date);
    if (!session) {
      return {
        date,
        currentToken: null,
        upcomingTokens: [],
      };
    }
    const currentToken = session.tokens.find((t) => t.status === 'CALLED' || t.status === 'IN_CONSULTATION');
    const upcoming = session.tokens
      .filter((t) => ['IN_QUEUE', 'ISSUED'].includes(t.status))
      .slice(0, 5);
    return {
      date,
      currentToken: currentToken?.tokenNumber || null,
      upcomingTokens: upcoming.map((t) => t.tokenNumber),
      lastUpdated: new Date().toISOString(),
    };
  },
};
