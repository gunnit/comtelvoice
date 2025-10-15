import { prisma } from '../index.js';
import type { Transcript } from '@prisma/client';

export interface CreateTranscriptInput {
  callSid: string;
  speaker: 'user' | 'agent' | 'system';
  agentName?: string;
  text: string;
  sequenceNumber?: number;
  confidence?: number;
  duration?: number;
  eventType?: string;
}

/**
 * Transcript Service
 * CRUD operations for conversation transcripts
 */
export const transcriptService = {
  /**
   * Save a transcript entry for a call
   */
  async save(data: CreateTranscriptInput): Promise<Transcript | null> {
    try {
      // Get the call record
      const call = await prisma.call.findUnique({
        where: { callSid: data.callSid },
        include: {
          transcripts: {
            orderBy: { sequenceNumber: 'desc' },
            take: 1,
          },
        },
      });

      if (!call) {
        console.error(`❌ Call ${data.callSid} not found for transcript`);
        return null;
      }

      // Auto-increment sequence number if not provided
      const sequenceNumber = data.sequenceNumber ??
        (call.transcripts[0]?.sequenceNumber ?? 0) + 1;

      const transcript = await prisma.transcript.create({
        data: {
          callId: call.id,
          speaker: data.speaker,
          agentName: data.agentName,
          text: data.text,
          sequenceNumber,
          confidence: data.confidence,
          duration: data.duration,
          eventType: data.eventType,
        },
      });

      console.log(`📝 Transcript saved: ${data.speaker} - "${data.text.substring(0, 50)}..."`);
      return transcript;
    } catch (error) {
      console.error('❌ Failed to save transcript:', error);
      return null;
    }
  },

  /**
   * Get complete transcript for a call
   */
  async getCallTranscript(callSid: string): Promise<Transcript[]> {
    try {
      const call = await prisma.call.findUnique({
        where: { callSid },
      });

      if (!call) {
        console.error(`❌ Call ${callSid} not found`);
        return [];
      }

      return await prisma.transcript.findMany({
        where: { callId: call.id },
        orderBy: { sequenceNumber: 'asc' },
      });
    } catch (error) {
      console.error(`❌ Failed to fetch transcript for ${callSid}:`, error);
      return [];
    }
  },

  /**
   * Get formatted transcript for a call
   */
  async getFormattedTranscript(callSid: string): Promise<string> {
    const transcripts = await this.getCallTranscript(callSid);

    if (transcripts.length === 0) {
      return 'No transcript available.';
    }

    return transcripts
      .map((t) => {
        const speaker = t.speaker === 'agent'
          ? `${t.agentName || 'Agent'}`
          : t.speaker === 'user'
            ? 'User'
            : 'System';

        const time = t.timestamp.toISOString().substring(11, 19); // HH:MM:SS
        return `[${time}] ${speaker}: ${t.text}`;
      })
      .join('\n');
  },

  /**
   * Search transcripts by text content
   */
  async searchTranscripts(
    query: string,
    limit: number = 50
  ): Promise<Transcript[]> {
    try {
      return await prisma.transcript.findMany({
        where: {
          text: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error(`❌ Failed to search transcripts for "${query}":`, error);
      return [];
    }
  },

  /**
   * Get recent transcripts across all calls
   */
  async getRecent(limit: number = 100): Promise<Transcript[]> {
    try {
      return await prisma.transcript.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: { call: true },
      });
    } catch (error) {
      console.error('❌ Failed to fetch recent transcripts:', error);
      return [];
    }
  },

  /**
   * Get statistics about transcripts
   */
  async getStats(callSid: string) {
    try {
      const call = await prisma.call.findUnique({
        where: { callSid },
      });

      if (!call) {
        return null;
      }

      const transcripts = await prisma.transcript.findMany({
        where: { callId: call.id },
      });

      const userMessages = transcripts.filter((t) => t.speaker === 'user');
      const agentMessages = transcripts.filter((t) => t.speaker === 'agent');

      return {
        totalMessages: transcripts.length,
        userMessages: userMessages.length,
        agentMessages: agentMessages.length,
        avgUserMessageLength:
          userMessages.length > 0
            ? Math.round(
                userMessages.reduce((sum, t) => sum + t.text.length, 0) / userMessages.length
              )
            : 0,
        avgAgentMessageLength:
          agentMessages.length > 0
            ? Math.round(
                agentMessages.reduce((sum, t) => sum + t.text.length, 0) / agentMessages.length
              )
            : 0,
      };
    } catch (error) {
      console.error(`❌ Failed to get transcript stats for ${callSid}:`, error);
      return null;
    }
  },
};
