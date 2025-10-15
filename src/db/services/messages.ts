import { prisma } from '../index.js';
import type { Message } from '@prisma/client';

export interface CreateMessageInput {
  recipientName: string;
  callerName: string;
  callerPhone: string;
  content: string;
  urgent?: boolean;
  callSid?: string;
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
      // Get callId if callSid is provided
      let callId: string | undefined;
      if (data.callSid) {
        const call = await prisma.call.findUnique({
          where: { callSid: data.callSid },
        });
        callId = call?.id;
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
        },
      });

      console.log('✅ Message saved:', {
        referenceNumber: message.referenceNumber,
        recipient: message.recipientName,
        from: message.callerName,
        urgent: message.urgent,
      });

      return message;
    } catch (error) {
      console.error('❌ Failed to create message:', error);
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
      console.error(`❌ Failed to update message ${referenceNumber}:`, error);
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
      console.error(`❌ Failed to mark message ${referenceNumber} as read:`, error);
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
      console.error(`❌ Failed to fetch message ${referenceNumber}:`, error);
      return null;
    }
  },

  /**
   * Get unread messages
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
      console.error('❌ Failed to fetch unread messages:', error);
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
      console.error(`❌ Failed to fetch messages for ${recipientName}:`, error);
      return [];
    }
  },

  /**
   * Get urgent messages
   */
  async getUrgent(limit: number = 100): Promise<Message[]> {
    try {
      return await prisma.message.findMany({
        where: {
          urgent: true,
          status: { in: ['unread', 'read'] }, // Not archived
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error('❌ Failed to fetch urgent messages:', error);
      return [];
    }
  },
};
