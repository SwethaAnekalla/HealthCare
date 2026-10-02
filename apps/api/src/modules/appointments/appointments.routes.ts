import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { verifyAuth, requireRole } from '../../middleware/auth';
import { appointmentCreateSchema, UserRole } from '@caresync/shared';
import { appointmentsService } from './appointments.service';
import { errors } from '../../lib/error';
import { prisma } from '../../lib/prisma';

const router = Router();

/**
 * POST /appointments
 * Create new appointment
 */
router.post(
  '/',
  verifyAuth,
  requireRole(['PATIENT'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const data = appointmentCreateSchema.parse(req.body);

    // Get patient profile
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!patient) {
      throw errors.NOT_FOUND('Patient profile');
    }

    // Get doctor user ID
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: data.doctorId },
      select: { userId: true },
    });

    if (!doctor) {
      throw errors.NOT_FOUND('Doctor');
    }

    const result = await appointmentsService.createAppointment(
      patient.id,
      req.userId!,
      {
        ...data,
        doctorUserId: doctor.userId,
      },
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  }),
);

/**
 * GET /appointments
 * Get patient's appointments
 */
router.get(
  '/',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, page = 1, limit = 10 } = req.query;

    // Get patient profile
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!patient) {
      throw errors.NOT_FOUND('Patient profile');
    }

    const result = await appointmentsService.getPatientAppointments(
      patient.id,
      (status as string) || undefined,
      parseInt(page as string),
      parseInt(limit as string),
    );

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * GET /appointments/doctor/list
 * Get doctor's appointments (must be before /:id route)
 */
router.get(
  '/doctor/list',
  verifyAuth,
  requireRole(UserRole.DOCTOR),
  asyncHandler(async (req: Request, res: Response) => {
    const { date, page = 1, limit = 20 } = req.query;

    // Get doctor profile
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!doctor) {
      throw errors.NOT_FOUND('Doctor profile');
    }

    const result = await appointmentsService.getDoctorAppointments(
      doctor.id,
      (date as string) || undefined,
      parseInt(page as string),
      parseInt(limit as string),
    );

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * GET /appointments/:id
 * Get appointment details
 */
router.get(
  '/:id',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentsService.getAppointmentDetails(
      req.params.id,
      req.userId!,
    );

    res.json({
      success: true,
      data: appointment,
    });
  }),
);

/**
 * POST /appointments/:id/cancel
 * Cancel appointment
 */
router.post(
  '/:id/cancel',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { reason = 'No reason provided' } = req.body;

    const result = await appointmentsService.cancelAppointment(
      req.params.id,
      req.userId!,
      reason,
    );

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * POST /appointments/:id/reschedule
 * Reschedule appointment
 */
router.post(
  '/:id/reschedule',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { newSlotId } = req.body;

    if (!newSlotId) {
      throw errors.VALIDATION_ERROR('newSlotId is required');
    }

    const result = await appointmentsService.rescheduleAppointment(
      req.params.id,
      req.userId!,
      newSlotId,
    );

    res.json({
      success: true,
      data: result,
    });
  }),
);

export default router;
