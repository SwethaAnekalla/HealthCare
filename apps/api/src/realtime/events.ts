// Real-time event types for Socket.IO
export enum RealtimeEvents {
  // Doctor Status
  DOCTOR_STATUS_CHANGED = 'doctor:status:changed',
  DOCTOR_STATUS_SUBSCRIBE = 'doctor:status:subscribe',
  DOCTOR_STATUS_UNSUBSCRIBE = 'doctor:status:unsubscribe',

  // Queue
  QUEUE_UPDATED = 'queue:updated',
  QUEUE_POSITION_CHANGED = 'queue:position:changed',
  QUEUE_NEXT_PATIENT = 'queue:next:patient',
  QUEUE_SUBSCRIBE = 'queue:subscribe',
  QUEUE_UNSUBSCRIBE = 'queue:unsubscribe',

  // Support Chat
  CHAT_MESSAGE_RECEIVED = 'chat:message:received',
  CHAT_AGENT_ASSIGNED = 'chat:agent:assigned',
  CHAT_TYPING = 'chat:typing',
  CHAT_RESOLVED = 'chat:resolved',
  CHAT_SUBSCRIBE = 'chat:subscribe',

  // Refunds
  REFUND_APPROVED = 'refund:approved',
  REFUND_CREDITED = 'refund:credited',
  REFUND_SLA_BREACHED = 'refund:sla:breached',

  // Notifications
  NOTIFICATION_SENT = 'notification:sent',

  // Connection
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
}

export interface DoctorStatusPayload {
  doctorId: string;
  status: string;
  clinic: string;
  updatedAt: Date;
}

export interface QueueUpdatePayload {
  clinicId: string;
  doctorId?: string;
  totalTokens: number;
  currentToken?: number;
  updatedAt: Date;
}

export interface QueuePositionPayload {
  appointmentId: string;
  position: number;
  eta: number; // in minutes
  totalInQueue: number;
}

export interface ChatMessagePayload {
  ticketId: string;
  userId: string;
  message: string;
  isAgent: boolean;
  timestamp: Date;
}

export interface ChatAgentAssignedPayload {
  ticketId: string;
  agentId: string;
  agentName: string;
}

export interface RefundNotificationPayload {
  refundId: string;
  appointmentId: string;
  userId: string;
  amount: number;
  status: string;
  timestamp: Date;
}

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  timestamp: Date;
}
