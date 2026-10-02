import {
  UserRole,
  UserStatus,
  DoctorStatusType,
  AppointmentStatus,
  ConsultationMode,
  RefundStatus,
  TicketStatus,
  QueueTokenStatus,
  NotificationType,
} from './enums';

// API Response Envelope
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  clinicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Patient
export interface PatientProfile {
  id: string;
  userId: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

// Doctor
export interface DoctorProfile {
  id: string;
  userId: string;
  registrationNumber: string;
  experience: number; // in years
  bio?: string;
  languages: string[];
  qualifications: string[];
  consultationFee: number;
  verificationStatus: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorStatus {
  id: string;
  doctorId: string;
  status: DoctorStatusType;
  delayMinutes?: number;
  reason?: string;
  leaveStartDate?: string;
  leaveEndDate?: string;
  setBy: string; // userId
  updatedAt: string;
}

// Clinic
export interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  verificationStatus: string;
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

// Specialty
export interface Specialty {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  synonyms: string[];
  isRare: boolean;
}

// Appointment
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  slotId: string;
  status: AppointmentStatus;
  consultationMode: ConsultationMode;
  reason: string;
  symptoms?: string[];
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  lockedFee: number;
  feeVersion: number;
  lockedAt: string;
  paymentId?: string;
  refundId?: string;
  prescriptionId?: string;
  consultationNotes?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  cancellationTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}

// Availability & Slots
export interface TimeSlot {
  id: string;
  doctorId: string;
  clinicId: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'HELD';
  appointmentId?: string;
  holdExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Payment
export interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  providerReference: string;
  createdAt: string;
  updatedAt: string;
}

// Refund (Unique Feature 2)
export interface Refund {
  id: string;
  appointmentId: string;
  paymentId: string;
  amount: number;
  status: RefundStatus;
  destination: 'ORIGINAL_PAYMENT_METHOD' | 'WALLET';
  providerReference?: string;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  creditedAt?: string;
  failureReason?: string;
  slaExpectedAt: string;
  slaBreached: boolean;
  events: RefundEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface RefundEvent {
  id: string;
  refundId: string;
  status: RefundStatus;
  message: string;
  createdBy?: string;
  createdAt: string;
}

// Wallet
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  reference: string; // refundId, appointmentId, etc.
  createdAt: string;
}

// Support & Chat (Unique Feature 3)
export interface SupportTicket {
  id: string;
  userId: string;
  assignedAgentId?: string;
  status: TicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  linkedAppointmentId?: string;
  linkedRefundId?: string;
  conversationId: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'USER' | 'BOT' | 'AGENT';
  message: string;
  attachmentUrls: string[];
  readAt?: string;
  createdAt: string;
}

// Queue (Unique Feature 6)
export interface QueueToken {
  id: string;
  appointmentId: string;
  tokenNumber: number;
  status: QueueTokenStatus;
  position?: number;
  checkInTime?: string;
  startConsultationTime?: string;
  endConsultationTime?: string;
  noShowGracePeriodExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueSession {
  id: string;
  doctorId: string;
  clinicId: string;
  date: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  totalTokensIssued: number;
  currentTokenNumber?: number;
  averageConsultationDuration: number; // in seconds
  createdAt: string;
  updatedAt: string;
}

export interface DoctorPaceMetric {
  id: string;
  doctorId: string;
  date: string;
  consultationDuration: number; // in seconds
  createdAt: string;
}

// Pricing & Disputes (Unique Feature 5)
export interface Fee {
  id: string;
  doctorId: string;
  clinicId: string;
  amount: number;
  version: number;
  effectiveFrom: string;
  changedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceDispute {
  id: string;
  appointmentId: string;
  reportedBy: string;
  lockedFee: number;
  claimedAmount: number;
  status: 'OPEN' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CLOSED';
  evidenceUrls: string[];
  description: string;
  resolution?: string;
  refundAmount?: number;
  refundId?: string;
  clinicPenaltyApplied: boolean;
  createdAt: string;
  updatedAt: string;
}

// Symptom Match (Unique Feature 4)
export interface SymptomMatchResult {
  specialties: SpecialtyMatch[];
  doctors: DoctorMatch[];
  redFlags: RedFlag[];
  message: string;
}

export interface SpecialtyMatch {
  specialtyId: string;
  specialtyName: string;
  confidence: number; // 0-100
  reason: string;
  alternativeSpecialties?: SpecialtyMatch[];
  doctorCount: number;
  availableDoctorCount: number;
}

export interface DoctorMatch {
  id: string;
  name: string;
  specialties: string[];
  fee: number;
  experience: number;
  rating: number;
  reviewCount: number;
  status: DoctorStatusType;
  nextAvailableSlot?: string;
  consultationMode: ConsultationMode;
  distance?: number;
  languages: string[];
}

export interface RedFlag {
  symptom: string;
  severity: 'HIGH' | 'CRITICAL';
  guidance: string;
  emergencyContact?: string;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: string[];
  readAt?: string;
  createdAt: string;
}

// Analytics
export interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowRate: number;
  averageWaitTime: number;
  averageRefundTime: number;
  supportCsat: number;
  unmatchedSymptomQueries: number;
}
