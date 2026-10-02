import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { verifyAuth, requireRole } from '../middleware/auth';
import { doctorStatusService } from './doctor-status/doctor-status.service';
import { refundsService } from './refunds/refunds.service';
import { supportService } from './support/support.service';
import { symptomMatcher } from './symptom-match/symptom-matcher';
import { pricingService } from './pricing/pricing.service';
import { queueService } from './queue/queue.service';
import { errors } from '../lib/error';

const router = Router();

// ===== FEATURE 1: DOCTOR STATUS =====
router.get(
  '/doctor-status/:doctorId',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const status = await doctorStatusService.getDoctorStatus(req.params.doctorId);
    res.json({ success: true, data: status });
  }),
);

router.post(
  '/doctor-status/:doctorId',
  verifyAuth,
  requireRole(['DOCTOR', 'ADMIN'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const { newStatus, delayMinutes, reason, leaveStartDate, leaveEndDate } = req.body;
    const status = await doctorStatusService.updateDoctorStatus(
      req.params.doctorId,
      newStatus,
      delayMinutes,
      reason,
      leaveStartDate ? new Date(leaveStartDate) : undefined,
      leaveEndDate ? new Date(leaveEndDate) : undefined,
      req.userId!,
    );
    res.json({ success: true, data: status });
  }),
);

// ===== FEATURE 2: REFUNDS =====
router.get(
  '/refunds/:refundId',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const refund = await refundsService.getRefund(req.params.refundId);
    res.json({ success: true, data: refund });
  }),
);

router.get(
  '/refunds/patient/:patientId',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await refundsService.getPatientRefunds(req.params.patientId);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/refunds/:refundId/approve',
  verifyAuth,
  requireRole(['ADMIN'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await refundsService.approveRefund(req.params.refundId, req.userId!);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/refunds/:refundId/process',
  verifyAuth,
  requireRole(['ADMIN'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await refundsService.processRefund(req.params.refundId);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/refunds/:refundId/credit',
  verifyAuth,
  requireRole(['ADMIN'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await refundsService.creditRefund(req.params.refundId);
    res.json({ success: true, data: result });
  }),
);

// ===== FEATURE 3: SUPPORT =====
router.post(
  '/support/tickets',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.body;
    const ticket = await supportService.createTicket(req.userId!, category);
    res.status(201).json({ success: true, data: ticket });
  }),
);

router.post(
  '/support/tickets/:conversationId/escalate',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await supportService.escalateToHuman(req.params.conversationId, req.userId!);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/support/messages',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { conversationId, message } = req.body;
    const msg = await supportService.sendMessage(conversationId, req.userId!, message);
    res.status(201).json({ success: true, data: msg });
  }),
);

router.get(
  '/support/tickets/agent/:agentId',
  verifyAuth,
  requireRole(['SUPPORT_AGENT', 'ADMIN'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const tickets = await supportService.getTicketsForAgent(req.params.agentId, (status as string) || undefined);
    res.json({ success: true, data: tickets });
  }),
);

router.post(
  '/support/tickets/:ticketId/csat',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { rating, comment } = req.body;
    const result = await supportService.submitCSAT(req.params.ticketId, rating, comment);
    res.json({ success: true, data: result });
  }),
);

// ===== FEATURE 4: SYMPTOM MATCHING =====
router.post(
  '/symptom-match',
  asyncHandler(async (req: Request, res: Response) => {
    const { symptoms } = req.body;
    
    if (!symptoms) {
      throw errors.VALIDATION_ERROR('Symptoms required');
    }

    const match = await symptomMatcher.match(symptoms);
    const doctorsResult = await symptomMatcher.getDoctorsForSpecialties(
      match.specialties.map((s) => s.name),
    );

    res.json({
      success: true,
      data: {
        specialties: match.specialties,
        doctors: doctorsResult.doctors,
        redFlags: match.redFlags,
        message: 'Specialists and doctors matched based on your symptoms',
      },
    });
  }),
);

// ===== FEATURE 5: PRICING =====
router.get(
  '/pricing/fee/:doctorId/:clinicId',
  asyncHandler(async (req: Request, res: Response) => {
    const fee = await pricingService.getDoctorFee(req.params.doctorId, req.params.clinicId);
    res.json({ success: true, data: fee });
  }),
);

router.post(
  '/pricing/disputes',
  verifyAuth,
  requireRole(['PATIENT'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId, claimedAmount, evidenceUrls, description } = req.body;
    const dispute = await pricingService.reportPriceDispute(
      appointmentId,
      req.userId!,
      claimedAmount,
      evidenceUrls,
      description,
    );
    res.status(201).json({ success: true, data: dispute });
  }),
);

router.get(
  '/pricing/disputes',
  verifyAuth,
  requireRole(['ADMIN'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await pricingService.getPriceDisputes(
      (status as string) || undefined,
      parseInt(page as string),
      parseInt(limit as string),
    );
    res.json({ success: true, data: result });
  }),
);

// ===== FEATURE 6: QUEUE =====
router.post(
  '/queue/check-in',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId, checkInType } = req.body;
    const result = await queueService.checkIn(
      appointmentId,
      req.userId!,
      checkInType || 'ON_SITE',
    );
    res.json({ success: true, data: result });
  }),
);

router.get(
  '/queue/position/:appointmentId',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const position = await queueService.getQueuePosition(req.params.appointmentId, req.userId!);
    res.json({ success: true, data: position });
  }),
);

router.post(
  '/queue/call-next',
  verifyAuth,
  requireRole(['DOCTOR', 'CLINIC_STAFF'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const { doctorId, clinicId, date } = req.body;
    const result = await queueService.callNextPatient(doctorId, clinicId, date);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/queue/complete',
  verifyAuth,
  requireRole(['DOCTOR'] as any),
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId, notes } = req.body;
    const doctor = await require('../lib/prisma').prisma.doctorProfile.findUnique({
      where: { userId: req.userId },
    });
    if (!doctor) throw errors.NOT_FOUND('Doctor');
    const result = await queueService.completeConsultation(appointmentId, doctor.id, notes);
    res.json({ success: true, data: result });
  }),
);

router.get(
  '/queue/display/:doctorId/:clinicId/:date',
  asyncHandler(async (req: Request, res: Response) => {
    const { doctorId, clinicId, date } = req.params;
    const display = await queueService.getQueueDisplay(clinicId, doctorId, date);
    res.json({ success: true, data: display });
  }),
);

export default router;
