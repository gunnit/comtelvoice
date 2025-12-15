import { prisma } from '../index.js';
import type { Call } from '@prisma/client';

export interface CreateCallInput {
  callSid: string;
  streamSid?: string;
  from: string;
  to?: string;
  status?: string;
  userId?: string;
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
          userId: data.userId,
        },
      });
    } catch (error) {
      console.error('Failed to create call record:', error);
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
      console.error(`Failed to update call ${callSid}:`, error);
      return null;
    }
  },

  /**
   * Get a call by Call SID (no user filter - for internal use)
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
      console.error(`Failed to fetch call ${callSid}:`, error);
      return null;
    }
  },

  /**
   * Get a call by Call SID - filtered by user
   */
  async getBySidForUser(callSid: string, userId: string): Promise<Call | null> {
    try {
      return await prisma.call.findFirst({
        where: { callSid, userId },
        include: {
          callbacks: true,
          messages: true,
        },
      });
    } catch (error) {
      console.error(`Failed to fetch call ${callSid} for user ${userId}:`, error);
      return null;
    }
  },

  /**
   * Get recent calls with pagination (no user filter - for internal use)
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
      console.error('Failed to fetch recent calls:', error);
      return [];
    }
  },

  /**
   * Get recent calls for a specific user
   */
  async getRecentForUser(userId: string, limit: number = 50): Promise<Call[]> {
    try {
      return await prisma.call.findMany({
        where: { userId },
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          callbacks: true,
          messages: true,
        },
      });
    } catch (error) {
      console.error(`Failed to fetch recent calls for user ${userId}:`, error);
      return [];
    }
  },

  /**
   * Get call statistics for a user
   */
  async getStatsForUser(userId: string) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [total, completed, calls] = await Promise.all([
        prisma.call.count({ where: { userId } }),
        prisma.call.count({ where: { userId, status: 'completed' } }),
        prisma.call.findMany({
          where: { userId, startedAt: { gte: thirtyDaysAgo } },
          select: { duration: true, startedAt: true },
        }),
      ]);

      const avgDuration = calls.length > 0
        ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length)
        : 0;

      // Group calls by day for chart
      const callsByDay: Record<string, number> = {};
      calls.forEach(call => {
        const day = call.startedAt.toISOString().split('T')[0];
        callsByDay[day] = (callsByDay[day] || 0) + 1;
      });

      return {
        totalCalls: total,
        completedCalls: completed,
        avgDuration,
        callsByDay,
      };
    } catch (error) {
      console.error(`Failed to get stats for user ${userId}:`, error);
      return {
        totalCalls: 0,
        completedCalls: 0,
        avgDuration: 0,
        callsByDay: {},
      };
    }
  },
};
