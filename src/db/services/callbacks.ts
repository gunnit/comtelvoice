import { prisma } from '../index.js';
import type { Callback } from '@prisma/client';

export interface CreateCallbackInput {
  callerName: string;
  callerPhone: string;
  preferredTime: string;
  reason?: string;
  callSid?: string;
  priority?: 'normal' | 'high' | 'urgent';
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
      // Get callId if callSid is provided
      let callId: string | undefined;
      if (data.callSid) {
        const call = await prisma.call.findUnique({
          where: { callSid: data.callSid },
        });
        callId = call?.id;
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
        },
      });

      console.log('✅ Callback request saved:', {
        referenceNumber: callback.referenceNumber,
        callerName: callback.callerName,
        preferredTime: callback.preferredTime,
      });

      return callback;
    } catch (error) {
      console.error('❌ Failed to create callback:', error);
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
      console.error(`❌ Failed to update callback ${referenceNumber}:`, error);
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
      console.error(`❌ Failed to fetch callback ${referenceNumber}:`, error);
      return null;
    }
  },

  /**
   * Get pending callbacks
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
      console.error('❌ Failed to fetch pending callbacks:', error);
      return [];
    }
  },

  /**
   * Get callbacks by status
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
      console.error(`❌ Failed to fetch callbacks with status ${status}:`, error);
      return [];
    }
  },
};
