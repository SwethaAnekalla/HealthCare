import { prisma } from '../../lib/prisma';
import { errors } from '../../lib/error';
import { logger } from '../../lib/logger';

export const doctorStatusService = {
  /**
   * Get current status for a doctor
   */
  async getDoctorStatus(doctorId: string) {
    const status = await prisma.doctorStatus.findUnique({
      where: { doctorId },
      include: {
        doctor: { select: { id: true, userId: true } },
        setByUser: { select: { id: true, name: true } },
      },
    });

    if (!status) {
      throw errors.NOT_FOUND('Doctor status');
    }

    return {
      id: status.id,
      doctorId: status.doctorId,
      status: status.status,
      delayMinutes: status.delayMinutes,
      reason: status.reason,
      leaveStartDate: status.leaveStartDate?.toISOString(),
      leaveEndDate: status.leaveEndDate?.toISOString(),
      setByUser: status.setByUser.name,
      updatedAt: status.updatedAt.toISOString(),
    };
  },

  /**
   * Update doctor status with real-time notification
   */
  async updateDoctorStatus(
    doctorId: string,
    newStatus: string, // AVAILABLE, DELAYED, ON_LEAVE, UNAVAILABLE
    delayMinutes?: number,
    reason?: string,
    leaveStartDate?: Date,
    leaveEndDate?: Date,
    setByUserId?: string,
  ) {
    // Validate doctor exists
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!doctor) {
      throw errors.NOT_FOUND('Doctor');
    }

    // Check if status record exists
    let existingStatus = await prisma.doctorStatus.findUnique({
      where: { doctorId },
    });

    const now = new Date();
    let updated;

    if (existingStatus) {
      // Update existing
      updated = await prisma.$transaction(async (tx) => {
        // Record to history
        await tx.doctorStatusHistory.create({
          data: {
            doctorId,
            status: existingStatus.status,
            delayMinutes: existingStatus.delayMinutes,
            reason: existingStatus.reason,
            leaveStartDate: existingStatus.leaveStartDate,
            leaveEndDate: existingStatus.leaveEndDate,
            setByUserId: existingStatus.setByUserId,
          },
        });

        // Update current status
        return await tx.doctorStatus.update({
          where: { doctorId },
          data: {
            status: newStatus,
            delayMinutes: delayMinutes || null,
            reason: reason || null,
            leaveStartDate: leaveStartDate || null,
            leaveEndDate: leaveEndDate || null,
            setByUserId: setByUserId || existingStatus.setByUserId,
            updatedAt: now,
          },
          include: {
            doctor: true,
          },
        });
      });
    } else {
      // Create new
      updated = await prisma.doctorStatus.create({
        data: {
          doctorId,
          status: newStatus,
          delayMinutes: delayMinutes || null,
          reason: reason || null,
          leaveStartDate: leaveStartDate || null,
          leaveEndDate: leaveEndDate || null,
          setByUserId: setByUserId || doctor.userId,
          createdAt: now,
        },
        include: {
          doctor: true,
        },
      });
    }

    logger.info(`Doctor status updated: ${doctorId} → ${newStatus}`);

    // **FEATURE 1: EMIT WEBSOCKET EVENT FOR REAL-TIME ALERTS**
    try {
      const realtimeGateway = (global as any).realtimeGateway;
      if (realtimeGateway) {
        realtimeGateway.broadcastDoctorStatus({
          doctorId,
          status: newStatus,
          clinic: doctor.user.name, // Doctor name as clinic identifier
          delayMinutes: delayMinutes || undefined,
          reason: reason,
          updatedAt: now,
        });
        logger.debug(`Doctor status event emitted for ${doctorId}`);
      }
    } catch (err) {
      logger.error('Failed to emit doctor status event', { error: err });
    }

    return {
      id: updated.id,
      doctorId: updated.doctorId,
      status: updated.status,
      delayMinutes: updated.delayMinutes,
      reason: updated.reason,
      leaveStartDate: updated.leaveStartDate?.toISOString(),
      leaveEndDate: updated.leaveEndDate?.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  /**
   * Set doctor as available
   */
  async setAvailable(doctorId: string, setByUserId?: string) {
    return this.updateDoctorStatus(doctorId, 'AVAILABLE', undefined, undefined, undefined, undefined, setByUserId);
  },

  /**
   * Set doctor as delayed
   */
  async setDelayed(doctorId: string, delayMinutes: number, reason?: string, setByUserId?: string) {
    if (delayMinutes < 0) {
      throw new Error('Delay minutes cannot be negative');
    }
    return this.updateDoctorStatus(doctorId, 'DELAYED', delayMinutes, reason, undefined, undefined, setByUserId);
  },

  /**
   * Set doctor as on leave
   */
  async setOnLeave(
    doctorId: string,
    startDate: Date,
    endDate: Date,
    reason?: string,
    setByUserId?: string,
  ) {
    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }
    return this.updateDoctorStatus(doctorId, 'ON_LEAVE', undefined, reason, startDate, endDate, setByUserId);
  },

  /**
   * Set doctor as unavailable
   */
  async setUnavailable(doctorId: string, reason?: string, setByUserId?: string) {
    return this.updateDoctorStatus(doctorId, 'UNAVAILABLE', undefined, reason, undefined, undefined, setByUserId);
  },

  /**
   * Get doctor status history
   */
  async getStatusHistory(doctorId: string, limit: number = 50) {
    const history = await prisma.doctorStatusHistory.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return history.map((h) => ({
      id: h.id,
      status: h.status,
      delayMinutes: h.delayMinutes,
      reason: h.reason,
      leaveStartDate: h.leaveStartDate?.toISOString(),
      leaveEndDate: h.leaveEndDate?.toISOString(),
      createdAt: h.createdAt.toISOString(),
    }));
  },

  /**
   * Get all doctors with their current statuses
   */
  async getAllDoctorsStatuses() {
    const statuses = await prisma.doctorStatus.findMany({
      include: {
        doctor: { select: { id: true, userId: true } },
        setByUser: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return statuses.map((s) => ({
      doctorId: s.doctorId,
      status: s.status,
      delayMinutes: s.delayMinutes,
      reason: s.reason,
      leaveStartDate: s.leaveStartDate?.toISOString(),
      leaveEndDate: s.leaveEndDate?.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  },

  /**
   * Check if doctor is available for appointments
   */
  async isAvailable(doctorId: string): Promise<boolean> {
    const status = await prisma.doctorStatus.findUnique({
      where: { doctorId },
    });

    if (!status) return true; // Default to available if no status set

    if (status.status === 'AVAILABLE') return true;
    if (status.status === 'DELAYED') return true; // Still accepting appointments but with delay
    if (status.status === 'ON_LEAVE') {
      const now = new Date();
      if (status.leaveStartDate && status.leaveEndDate) {
        return now < status.leaveStartDate || now > status.leaveEndDate;
      }
    }

    return false;
  },

  /**
   * Cleanup expired leaves
   */
  async cleanupExpiredLeaves() {
    const now = new Date();
    const updated = await prisma.doctorStatus.updateMany({
      where: {
        status: 'ON_LEAVE',
        leaveEndDate: { lt: now },
      },
      data: {
        status: 'AVAILABLE',
        leaveStartDate: null,
        leaveEndDate: null,
      },
    });

    logger.info(`Cleaned up ${updated.count} expired leaves`);
    return { updatedCount: updated.count };
  },
};
