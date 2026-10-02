import { z } from 'zod';
import {
  UserRole,
  DoctorStatusType,
  AppointmentStatus,
  ConsultationMode,
  RefundStatus,
} from './enums';

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().regex(/^\+?[0-9]{10,}$/),
  role: z.nativeEnum(UserRole),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Doctor Status Schema
export const doctorStatusUpdateSchema = z.object({
  status: z.nativeEnum(DoctorStatusType),
  delayMinutes: z.number().int().min(0).optional(),
  reason: z.string().max(500).optional(),
  leaveStartDate: z.string().datetime().optional(),
  leaveEndDate: z.string().datetime().optional(),
});

// Appointment Schema
export const appointmentCreateSchema = z.object({
  doctorId: z.string().uuid(),
  slotId: z.string().uuid(),
  patientId: z.string().uuid(),
  familyMemberId: z.string().uuid().optional(),
  consultationMode: z.nativeEnum(ConsultationMode),
  reason: z.string().max(1000),
  symptoms: z.array(z.string()).optional(),
});

// Refund Schema
export const refundSchema = z.object({
  appointmentId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().max(500),
});

// Symptom Match Schema
export const symptomMatchSchema = z.object({
  symptoms: z.string().max(2000),
  age: z.number().int().min(1).max(150).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  duration: z.string().optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
  bodyArea: z.string().optional(),
});

// Chat/Support Schema
export const chatMessageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().max(5000),
  attachmentUrls: z.array(z.string().url()).optional(),
});

export const escalateToHumanSchema = z.object({
  conversationId: z.string().uuid(),
  category: z.enum([
    'APPOINTMENT',
    'PAYMENT',
    'REFUND',
    'TECHNICAL',
    'BILLING',
    'OTHER',
  ]),
  reason: z.string().max(1000),
  appointmentId: z.string().uuid().optional(),
  refundId: z.string().uuid().optional(),
});

// Price Dispute Schema
export const priceDisputeSchema = z.object({
  appointmentId: z.string().uuid(),
  claimedAmount: z.number().positive(),
  evidenceUrls: z.array(z.string().url()),
  description: z.string().max(1000),
});

// Queue Check-in Schema
export const queueCheckInSchema = z.object({
  appointmentId: z.string().uuid(),
  checkInType: z.enum(['ON_SITE', 'REMOTE', 'GEOFENCE', 'QR_CODE']),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type DoctorStatusUpdate = z.infer<typeof doctorStatusUpdateSchema>;
export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>;
export type SymptomMatch = z.infer<typeof symptomMatchSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type EscalateToHuman = z.infer<typeof escalateToHumanSchema>;
export type PriceDisputeInput = z.infer<typeof priceDisputeSchema>;
export type QueueCheckIn = z.infer<typeof queueCheckInSchema>;
