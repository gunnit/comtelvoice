import { prisma } from '../index.js';
import type { Message } from '@prisma/client';

export interface CreateMessageInput {
  recipientName: string;
  callerName: string;
  callerPhone: string;
  content: string;
  urgent?: boolean;
  callSid?: string;
  userId?: string;
}

export interface UpdateMessageInput {
  status?: 'unread' | 'read' | 'forwarded' | 'archived';
  readAt?: Date;
  forwardedTo?: string;
  forwardedAt?: Date;
  priority?: 'normal' | 'high' | 'urgent';
}

/**
 * Message Service
 * CRUD operations for messages left for employees
 */
export const messageService = {
  /**
   * Generate a unique reference number in format MSG-xxxxx
   */
  generateReferenceNumber(): string {
    return `MSG-${Date.now()}`;
  },

  /**
   * Create a new message
   */
  async create(data: CreateMessageInput): Promise<Message> {
    try {
      // Get callId and userId from call if callSid is provided
      let callId: string | undefined;
      let userId = data.userId;

      if (data.callSid) {
        const call = await prisma.call.findUnique({
          where: { callSid: data.callSid },
        });
        callId = call?.id;
        // Inherit userId from call if not explicitly provided
        if (!userId && call?.userId) {
          userId = call.userId;
        }
      }

      const message = await prisma.message.create({
        data: {
          referenceNumber: this.generateReferenceNumber(),
          recipientName: data.recipientName,
          callerName: data.callerName,
          callerPhone: data.callerPhone,
          content: data.content,
          urgent: data.urgent || false,
          priority: data.urgent ? 'urgent' : 'normal',
          callId,
          userId,
        },
      });

      console.log('Message saved:', {
        referenceNumber: message.referenceNumber,
        recipient: message.recipientName,
        from: message.callerName,
        urgent: message.urgent,
      });

      return message;
    } catch (error) {
      console.error('Failed to create message:', error);
      throw error;
    }
  },

  /**
   * Update a message
   */
  async update(
    referenceNumber: string,
    data: UpdateMessageInput
  ): Promise<Message | null> {
    try {
      return await prisma.message.update({
        where: { referenceNumber },
        data,
      });
    } catch (error) {
      console.error(`Failed to update message ${referenceNumber}:`, error);
      return null;
    }
  },

  /**
   * Mark a message as read
   */
  async markAsRead(referenceNumber: string): Promise<Message | null> {
    try {
      return await prisma.message.update({
        where: { referenceNumber },
        data: {
          status: 'read',
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to mark message ${referenceNumber} as read:`, error);
      return null;
    }
  },

  /**
   * Get a message by reference number
   */
  async getByReference(referenceNumber: string): Promise<Message | null> {
    try {
      return await prisma.message.findUnique({
        where: { referenceNumber },
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch message ${referenceNumber}:`, error);
      return null;
    }
  },

  /**
   * Get unread messages (no user filter)
   */
  async getUnread(limit: number = 100): Promise<Message[]> {
    try {
      return await prisma.message.findMany({
        where: { status: 'unread' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
      return [];
    }
  },

  /**
   * Get unread messages for a specific user
   */
  async getUnreadForUser(userId: string, limit: number = 100): Promise<Message[]> {
    try {
      return await prisma.message.findMany({
        where: { userId, status: 'unread' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch unread messages for user ${userId}:`, error);
      return [];
    }
  },

  /**
   * Get messages for a specific recipient
   */
  async getByRecipient(
    recipientName: string,
    limit: number = 100
  ): Promise<Message[]> {
    try {
      return await prisma.message.findMany({
        where: { recipientName },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch messages for ${recipientName}:`, error);
      return [];
    }
  },

  /**
   * Get messages for a specific recipient and user
   */
  async getByRecipientForUser(
    userId: string,
    recipientName: string,
    limit: number = 100
  ): Promise<Message[]> {
    try {
      return await prisma.message.findMany({
        where: { userId, recipientName },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch messages for ${recipientName}:`, error);
      return [];
    }
  },

  /**
   * Get urgent messages (no user filter)
   */
  async getUrgent(limit: number = 100): Promise<Message[]> {
    try {
      return await prisma.message.findMany({
        where: {
          urgent: true,
          status: { in: ['unread', 'read'] },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error('Failed to fetch urgent messages:', error);
      return [];
    }
  },

  /**
   * Get urgent messages for a specific user
   */
  async getUrgentForUser(userId: string, limit: number = 100): Promise<Message[]> {
    try {
      return await prisma.message.findMany({
        where: {
          userId,
          urgent: true,
          status: { in: ['unread', 'read'] },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch urgent messages for user ${userId}:`, error);
      return [];
    }
  },

  /**
   * Get all messages for a user
   */
  async getAllForUser(userId: string, limit: number = 100): Promise<Message[]> {
    try {
      return await prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch all messages for user ${userId}:`, error);
      return [];
    }
  },

  /**
   * Count unread messages for a user
   */
  async countUnreadForUser(userId: string): Promise<number> {
    try {
      return await prisma.message.count({
        where: { userId, status: 'unread' },
      });
    } catch (error) {
      console.error(`Failed to count unread messages for user ${userId}:`, error);
      return 0;
    }
  },
};
