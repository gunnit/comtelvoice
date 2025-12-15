import { prisma } from '../index.js';
import type { Callback } from '@prisma/client';

export interface CreateCallbackInput {
  callerName: string;
  callerPhone: string;
  preferredTime: string;
  reason?: string;
  callSid?: string;
  priority?: 'normal' | 'high' | 'urgent';
  userId?: string;
}

export interface UpdateCallbackInput {
  status?: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  assignedTo?: string;
  scheduledFor?: Date;
  completedAt?: Date;
  priority?: 'normal' | 'high' | 'urgent';
}

/**
 * Callback Service
 * CRUD operations for callback requests
 */
export const callbackService = {
  /**
   * Generate a unique reference number in format RIC-xxxxx
   */
  generateReferenceNumber(): string {
    return `RIC-${Date.now()}`;
  },

  /**
   * Create a new callback request
   */
  async create(data: CreateCallbackInput): Promise<Callback> {
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

      const callback = await prisma.callback.create({
        data: {
          referenceNumber: this.generateReferenceNumber(),
          callerName: data.callerName,
          callerPhone: data.callerPhone,
          preferredTime: data.preferredTime,
          reason: data.reason,
          priority: data.priority || 'normal',
          callId,
          userId,
        },
      });

      console.log('Callback request saved:', {
        referenceNumber: callback.referenceNumber,
        callerName: callback.callerName,
        preferredTime: callback.preferredTime,
      });

      return callback;
    } catch (error) {
      console.error('Failed to create callback:', error);
      throw error;
    }
  },

  /**
   * Update a callback request
   */
  async update(
    referenceNumber: string,
    data: UpdateCallbackInput
  ): Promise<Callback | null> {
    try {
      return await prisma.callback.update({
        where: { referenceNumber },
        data,
      });
    } catch (error) {
      console.error(`Failed to update callback ${referenceNumber}:`, error);
      return null;
    }
  },

  /**
   * Get a callback by reference number
   */
  async getByReference(referenceNumber: string): Promise<Callback | null> {
    try {
      return await prisma.callback.findUnique({
        where: { referenceNumber },
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch callback ${referenceNumber}:`, error);
      return null;
    }
  },

  /**
   * Get pending callbacks (no user filter)
   */
  async getPending(limit: number = 100): Promise<Callback[]> {
    try {
      return await prisma.callback.findMany({
        where: { status: 'pending' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error('Failed to fetch pending callbacks:', error);
      return [];
    }
  },

  /**
   * Get pending callbacks for a specific user
   */
  async getPendingForUser(userId: string, limit: number = 100): Promise<Callback[]> {
    try {
      return await prisma.callback.findMany({
        where: { userId, status: 'pending' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch pending callbacks for user ${userId}:`, error);
      return [];
    }
  },

  /**
   * Get callbacks by status (no user filter)
   */
  async getByStatus(
    status: 'pending' | 'scheduled' | 'completed' | 'cancelled',
    limit: number = 100
  ): Promise<Callback[]> {
    try {
      return await prisma.callback.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch callbacks with status ${status}:`, error);
      return [];
    }
  },

  /**
   * Get callbacks by status for a specific user
   */
  async getByStatusForUser(
    userId: string,
    status: 'pending' | 'scheduled' | 'completed' | 'cancelled',
    limit: number = 100
  ): Promise<Callback[]> {
    try {
      return await prisma.callback.findMany({
        where: { userId, status },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch callbacks for user ${userId}:`, error);
      return [];
    }
  },

  /**
   * Get all callbacks for a user
   */
  async getAllForUser(userId: string, limit: number = 100): Promise<Callback[]> {
    try {
      return await prisma.callback.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`Failed to fetch all callbacks for user ${userId}:`, error);
      return [];
    }
  },

  /**
   * Count pending callbacks for a user
   */
  async countPendingForUser(userId: string): Promise<number> {
    try {
      return await prisma.callback.count({
        where: { userId, status: 'pending' },
      });
    } catch (error) {
      console.error(`Failed to count pending callbacks for user ${userId}:`, error);
      return 0;
    }
  },
};
