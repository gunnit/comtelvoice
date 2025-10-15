import { prisma } from '../index.js';
import type { Call } from '@prisma/client';

export interface CreateCallInput {
  callSid: string;
  streamSid?: string;
  from: string;
  to?: string;
  status?: string;
}

export interface UpdateCallInput {
  status?: string;
  endedAt?: Date;
  duration?: number;
}

/**
 * Call Service
 * CRUD operations for call records
 */
export const callService = {
  /**
   * Create a new call record
   */
  async create(data: CreateCallInput): Promise<Call> {
    try {
      return await prisma.call.create({
        data: {
          callSid: data.callSid,
          streamSid: data.streamSid,
          from: data.from,
          to: data.to,
          status: data.status || 'in-progress',
        },
      });
    } catch (error) {
      console.error('❌ Failed to create call record:', error);
      throw error;
    }
  },

  /**
   * Update an existing call record
   */
  async update(callSid: string, data: UpdateCallInput): Promise<Call | null> {
    try {
      return await prisma.call.update({
        where: { callSid },
        data: {
          status: data.status,
          endedAt: data.endedAt,
          duration: data.duration,
        },
      });
    } catch (error) {
      console.error(`❌ Failed to update call ${callSid}:`, error);
      return null;
    }
  },

  /**
   * Get a call by Call SID
   */
  async getBySid(callSid: string): Promise<Call | null> {
    try {
      return await prisma.call.findUnique({
        where: { callSid },
        include: {
          callbacks: true,
          messages: true,
        },
      });
    } catch (error) {
      console.error(`❌ Failed to fetch call ${callSid}:`, error);
      return null;
    }
  },

  /**
   * Get recent calls with pagination
   */
  async getRecent(limit: number = 50): Promise<Call[]> {
    try {
      return await prisma.call.findMany({
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          callbacks: true,
          messages: true,
        },
      });
    } catch (error) {
      console.error('❌ Failed to fetch recent calls:', error);
      return [];
    }
  },
};
