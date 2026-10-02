import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../lib/logger';
import { RealtimeEvents, DoctorStatusPayload, QueueUpdatePayload, ChatMessagePayload } from './events';

export class RealtimeGateway {
  private io: Server;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private doctorSubscribers: Map<string, Set<string>> = new Map(); // doctorId -> Set<socketId>
  private queueSubscribers: Map<string, Set<string>> = new Map(); // clinicId -> Set<socketId>
  private chatSubscribers: Map<string, Set<string>> = new Map(); // ticketId -> Set<socketId>

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  private setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Missing auth token'));
      }

      // TODO: Validate JWT token here
      socket.data.userId = socket.handshake.auth.userId;
      socket.data.role = socket.handshake.auth.role;
      next();
    });
  }

  private setupConnectionHandlers() {
    this.io.on(RealtimeEvents.CONNECTION, (socket: Socket) => {
      const userId = socket.data.userId;
      logger.info(`User connected: ${userId}`, { socketId: socket.id });

      this.userSockets.set(userId, socket.id);

      // Doctor Status Subscribe
      socket.on(RealtimeEvents.DOCTOR_STATUS_SUBSCRIBE, (data: { doctorId: string }) => {
        this.subscribeToDoctorStatus(socket, data.doctorId);
      });

      socket.on(RealtimeEvents.DOCTOR_STATUS_UNSUBSCRIBE, (data: { doctorId: string }) => {
        this.unsubscribeFromDoctorStatus(socket, data.doctorId);
      });

      // Queue Subscribe
      socket.on(RealtimeEvents.QUEUE_SUBSCRIBE, (data: { clinicId: string }) => {
        this.subscribeToQueue(socket, data.clinicId);
      });

      socket.on(RealtimeEvents.QUEUE_UNSUBSCRIBE, (data: { clinicId: string }) => {
        this.unsubscribeFromQueue(socket, data.clinicId);
      });

      // Chat Subscribe
      socket.on(RealtimeEvents.CHAT_SUBSCRIBE, (data: { ticketId: string }) => {
        this.subscribeToChat(socket, data.ticketId);
      });

      // Chat Messages
      socket.on(RealtimeEvents.CHAT_MESSAGE_RECEIVED, (data: ChatMessagePayload) => {
        this.handleChatMessage(socket, data);
      });

      // Chat Typing Indicator
      socket.on(RealtimeEvents.CHAT_TYPING, (data: { ticketId: string }) => {
        this.broadcastToChat(data.ticketId, RealtimeEvents.CHAT_TYPING, {
          userId: socket.data.userId,
          ticketId: data.ticketId,
        });
      });

      // Disconnect
      socket.on(RealtimeEvents.DISCONNECT, () => {
        logger.info(`User disconnected: ${userId}`);
        this.userSockets.delete(userId);
      });

      // Error handler
      socket.on(RealtimeEvents.ERROR, (error) => {
        logger.error('Socket error', { error, userId });
      });
    });
  }

  // Doctor Status Subscriptions
  private subscribeToDoctorStatus(socket: Socket, doctorId: string) {
    if (!this.doctorSubscribers.has(doctorId)) {
      this.doctorSubscribers.set(doctorId, new Set());
    }
    this.doctorSubscribers.get(doctorId)?.add(socket.id);
    logger.debug(`User subscribed to doctor status: ${doctorId}`);
  }

  private unsubscribeFromDoctorStatus(socket: Socket, doctorId: string) {
    this.doctorSubscribers.get(doctorId)?.delete(socket.id);
  }

  broadcastDoctorStatus(payload: DoctorStatusPayload) {
    const subscribers = this.doctorSubscribers.get(payload.doctorId);
    if (subscribers) {
      subscribers.forEach((socketId) => {
        this.io.to(socketId).emit(RealtimeEvents.DOCTOR_STATUS_CHANGED, payload);
      });
      logger.debug(`Doctor status broadcast: ${payload.doctorId}`, { subscribers: subscribers.size });
    }
  }

  // Queue Subscriptions
  private subscribeToQueue(socket: Socket, clinicId: string) {
    if (!this.queueSubscribers.has(clinicId)) {
      this.queueSubscribers.set(clinicId, new Set());
    }
    this.queueSubscribers.get(clinicId)?.add(socket.id);
    socket.join(`queue:${clinicId}`);
    logger.debug(`User subscribed to queue: ${clinicId}`);
  }

  private unsubscribeFromQueue(socket: Socket, clinicId: string) {
    this.queueSubscribers.get(clinicId)?.delete(socket.id);
    socket.leave(`queue:${clinicId}`);
  }

  broadcastQueueUpdate(payload: QueueUpdatePayload) {
    this.io.to(`queue:${payload.clinicId}`).emit(RealtimeEvents.QUEUE_UPDATED, payload);
    logger.debug(`Queue update broadcast: ${payload.clinicId}`);
  }

  broadcastQueuePositionChange(appointmentId: string, clinicId: string, position: number, eta: number) {
    this.io.to(`queue:${clinicId}`).emit(RealtimeEvents.QUEUE_POSITION_CHANGED, {
      appointmentId,
      position,
      eta,
    });
  }

  // Chat Subscriptions
  private subscribeToChat(socket: Socket, ticketId: string) {
    if (!this.chatSubscribers.has(ticketId)) {
      this.chatSubscribers.set(ticketId, new Set());
    }
    this.chatSubscribers.get(ticketId)?.add(socket.id);
    socket.join(`chat:${ticketId}`);
    logger.debug(`User subscribed to chat: ${ticketId}`);
  }

  private handleChatMessage(socket: Socket, data: ChatMessagePayload) {
    this.broadcastToChat(data.ticketId, RealtimeEvents.CHAT_MESSAGE_RECEIVED, {
      ...data,
      userId: socket.data.userId,
      timestamp: new Date(),
    });
  }

  private broadcastToChat(ticketId: string, event: string, data: any) {
    this.io.to(`chat:${ticketId}`).emit(event, data);
  }

  broadcastChatAgentAssigned(ticketId: string, agentId: string, agentName: string) {
    this.io.to(`chat:${ticketId}`).emit(RealtimeEvents.CHAT_AGENT_ASSIGNED, {
      ticketId,
      agentId,
      agentName,
      timestamp: new Date(),
    });
  }

  broadcastChatResolved(ticketId: string, rating?: number) {
    this.io.to(`chat:${ticketId}`).emit(RealtimeEvents.CHAT_RESOLVED, {
      ticketId,
      rating,
      timestamp: new Date(),
    });
  }

  // Notifications
  notifyUser(userId: string, payload: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(RealtimeEvents.NOTIFICATION_SENT, {
        ...payload,
        timestamp: new Date(),
      });
      logger.debug(`Notification sent to user: ${userId}`);
    }
  }

  // Refund Notifications
  notifyRefundApproved(userId: string, refundId: string, amount: number) {
    this.notifyUser(userId, {
      type: 'REFUND_APPROVED',
      title: 'Refund Approved',
      message: `Your refund of ₹${amount} has been approved.`,
      refundId,
      actionUrl: `/refunds/${refundId}`,
    });
  }

  notifyRefundCredited(userId: string, refundId: string, amount: number) {
    this.notifyUser(userId, {
      type: 'REFUND_CREDITED',
      title: 'Refund Credited',
      message: `₹${amount} has been credited to your wallet.`,
      refundId,
      actionUrl: `/refunds/${refundId}`,
    });
  }

  notifyQueuePosition(userId: string, position: number, eta: number) {
    this.notifyUser(userId, {
      type: 'QUEUE_UPDATE',
      title: position === 1 ? "You're Next!" : `You're ${position} away`,
      message: `Estimated wait time: ${eta} minutes`,
      actionUrl: '/queue-tracker',
    });
  }

  notifyDoctorStatus(userId: string, doctorName: string, status: string) {
    this.notifyUser(userId, {
      type: 'DOCTOR_STATUS_CHANGE',
      title: `Dr. ${doctorName} is ${status}`,
      message: `Your doctor has changed status. Please check your appointment.`,
      actionUrl: '/appointments',
    });
  }

  getConnectedUsers(): number {
    return this.userSockets.size;
  }

  getSubscriberCount(type: 'doctor' | 'queue' | 'chat', id: string): number {
    if (type === 'doctor') {
      return this.doctorSubscribers.get(id)?.size || 0;
    } else if (type === 'queue') {
      return this.queueSubscribers.get(id)?.size || 0;
    } else if (type === 'chat') {
      return this.chatSubscribers.get(id)?.size || 0;
    }
    return 0;
  }
}
