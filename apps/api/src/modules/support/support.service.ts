import { prisma } from '../../lib/prisma';
import { errors } from '../../lib/error';
import { logger } from '../../lib/logger';
export const supportService = {
  /**
   * Create support ticket and conversation
   */
  async createTicket(userId: string, category: string, reason?: string) {
    // Create conversation
    const conversation = await prisma.chatConversation.create({
      data: {
        userId,
        startedAt: new Date(),
      },
    });
    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        createdByUserId: userId,
        status: 'BOT',
        priority: 'MEDIUM',
        category,
        conversationId: conversation.id,
      },
    });
    logger.info(`Support ticket created: ${ticket.id}`);
    return {
      ticketId: ticket.id,
      conversationId: conversation.id,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
    };
  },
  /**
   * Send chat message
   */
  async sendMessage(conversationId: string, userId: string, message: string, senderType: 'USER' | 'BOT' | 'AGENT' = 'USER') {
    const msg = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        senderType,
        message,
        attachmentUrls: null,
      },
    });
    return {
      id: msg.id,
      message: msg.message,
      senderType: msg.senderType,
      createdAt: msg.createdAt.toISOString(),
    };
  },
  /**
   * Get chat conversation
   */
  async getConversation(conversationId: string, userId: string) {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { name: true } },
          },
        },
        ticket: true,
      },
    });
    if (!conversation) {
      throw errors.NOT_FOUND('Conversation');
    }
    // Check authorization
    if (conversation.userId !== userId && conversation.ticket?.createdByUserId !== userId) {
      throw errors.FORBIDDEN();
    }
    return {
      id: conversation.id,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        message: m.message,
        senderType: m.senderType,
        senderName: m.sender.name,
        createdAt: m.createdAt.toISOString(),
      })),
      ticket: conversation.ticket ? {
        id: conversation.ticket.id,
        status: conversation.ticket.status,
        priority: conversation.ticket.priority,
        assignedAgentId: conversation.ticket.assignedAgentUserId,
      } : null,
    };
  },
  /**
   * Escalate to human agent
   */
  async escalateToHuman(conversationId: string, userId: string) {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { ticket: true },
    });
    if (!conversation) {
      throw errors.NOT_FOUND('Conversation');
    }
    if (!conversation.ticket) {
      throw new Error('No associated ticket for this conversation');
    }
    // Find available agent
    const agent = await prisma.supportAgent.findFirst({
      where: { isOnline: true },
      orderBy: { activeTicketCount: 'asc' },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!agent) {
      logger.warn(`No agents available for escalation: ${conversationId}`);
    }
    
    // **FEATURE 4: UPDATE ESCALATION STATUS AND EMIT EVENT**
    const now = new Date();
    const updated = await prisma.supportTicket.update({
      where: { id: conversation.ticket.id },
      data: {
        status: 'WAITING_FOR_AGENT',
        assignedAgentUserId: agent?.userId,
        firstResponseAt: now,
        // This maps to escalatedToHumanAt in the schema
        // (we'll store escalation timestamp in the database by updating status change)
      },
      include: {
        assignedAgent: { select: { id: true, name: true } },
      },
    });
    
    // Emit WebSocket event to notify about escalation
    try {
      const realtimeGateway = (global as any).realtimeGateway;
      if (realtimeGateway && agent) {
        realtimeGateway.broadcastChatAgentAssigned(conversation.id, agent.userId, agent.user.name || 'Support Agent');
        logger.debug(`Chat escalation event emitted for ticket ${updated.id}`);
      }
    } catch (err) {
      logger.error('Failed to emit chat escalation event', { error: err });
    }
    
    logger.info(`Ticket escalated to agent: ${updated.id}`);
    return {
      ticketId: updated.id,
      status: updated.status,
      assignedAgent: agent?.userId,
      escalatedAt: now.toISOString(),
    };
  },
  /**
   * Get support tickets (agent view)
   */
  async getTicketsForAgent(agentId: string, status?: string) {
    const where: any = { assignedAgentUserId: agentId };
    if (status) {
      where.status = status;
    }
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        conversation: {
          select: { id: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return tickets.map((t) => ({
      id: t.id,
      conversationId: t.conversationId,
      userId: t.createdByUserId,
      userName: t.createdByUser.name,
      userEmail: t.createdByUser.email,
      status: t.status,
      priority: t.priority,
      category: t.category,
      lastMessage: t.conversation.messages[0]?.message,
      createdAt: t.createdAt.toISOString(),
    }));
  },
  /**
   * Resolve ticket
   */
  async resolveTicket(ticketId: string, resolutionSummary: string) {
    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });
    
    // Emit resolution event
    try {
      const realtimeGateway = (global as any).realtimeGateway;
      if (realtimeGateway) {
        realtimeGateway.broadcastChatResolved(updated.conversationId);
        logger.debug(`Chat resolution event emitted for ticket ${ticketId}`);
      }
    } catch (err) {
      logger.error('Failed to emit chat resolution event', { error: err });
    }
    
    logger.info(`Ticket resolved: ${ticketId}`);
    return {
      id: updated.id,
      status: updated.status,
      resolvedAt: updated.resolvedAt?.toISOString(),
    };
  },
  /**
   * Submit CSAT rating
   */
  async submitCSAT(ticketId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw errors.VALIDATION_ERROR('Rating must be between 1 and 5');
    }
    const csat = await prisma.csatRating.create({
      data: {
        ticketId,
        rating,
        comment,
      },
    });
    logger.info(`CSAT submitted for ticket ${ticketId}: ${rating}/5`);
    return {
      id: csat.id,
      rating: csat.rating,
      createdAt: csat.createdAt.toISOString(),
    };
  },
  /**
   * Get support metrics (admin)
   */
  async getSupportMetrics() {
    const [totalTickets, resolvedTickets, csatScore] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.csatRating.aggregate({
        _avg: { rating: true },
      }),
    ]);
    return {
      totalTickets,
      resolvedTickets,
      resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) : '0',
      avgCSATScore: (csatScore._avg.rating || 0).toFixed(2),
    };
  },
};
