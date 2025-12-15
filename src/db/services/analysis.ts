import { prisma } from '../index.js';
import type { CallAnalysis } from '@prisma/client';

export interface CreateAnalysisInput {
  callId: string;
  summary: string;
  sentimentOverall: 'positive' | 'neutral' | 'negative' | 'frustrated';
  sentimentTrend?: 'improving' | 'stable' | 'declining';
  sentimentScore?: number;
  primaryIntent: 'sales_inquiry' | 'support' | 'complaint' | 'info_request' | 'callback_request' | 'other';
  secondaryIntents?: string[];
  entities?: {
    names: string[];
    products: string[];
    dates: string[];
    phones: string[];
    emails: string[];
  };
  actionItems?: Array<{
    description: string;
    assignee?: string;
    priority?: string;
  }>;
  urgencyScore: 'low' | 'medium' | 'high' | 'critical';
  urgencyReason?: string;
  leadScore?: 'hot' | 'warm' | 'cold';
  leadScoreReason?: string;
  isFaq: boolean;
  faqTopic?: string;
  resolutionStatus: 'resolved' | 'needs_followup' | 'escalated' | 'unknown';
  topicTags?: string[];
  modelUsed: string;
  tokensUsed?: number;
  processingTimeMs?: number;
  language: string;
}

/**
 * Analysis Service
 * CRUD operations for AI-powered call analysis results
 */
export const analysisService = {
  /**
   * Create a new call analysis
   */
  async create(data: CreateAnalysisInput): Promise<CallAnalysis> {
    try {
      return await prisma.callAnalysis.create({
        data: {
          callId: data.callId,
          summary: data.summary,
          sentimentOverall: data.sentimentOverall,
          sentimentTrend: data.sentimentTrend,
          sentimentScore: data.sentimentScore,
          primaryIntent: data.primaryIntent,
          secondaryIntents: data.secondaryIntents,
          entities: data.entities,
          actionItems: data.actionItems,
          urgencyScore: data.urgencyScore,
          urgencyReason: data.urgencyReason,
          leadScore: data.leadScore,
          leadScoreReason: data.leadScoreReason,
          isFaq: data.isFaq,
          faqTopic: data.faqTopic,
          resolutionStatus: data.resolutionStatus,
          topicTags: data.topicTags,
          modelUsed: data.modelUsed,
          tokensUsed: data.tokensUsed,
          processingTimeMs: data.processingTimeMs,
          language: data.language,
        },
      });
    } catch (error) {
      console.error('Failed to create call analysis:', error);
      throw error;
    }
  },

  /**
   * Get analysis by call ID
   */
  async getByCallId(callId: string): Promise<CallAnalysis | null> {
    try {
      return await prisma.callAnalysis.findUnique({
        where: { callId },
      });
    } catch (error) {
      console.error(`Failed to fetch analysis for call ${callId}:`, error);
      return null;
    }
  },

  /**
   * Get analysis by call SID (joins through Call table)
   */
  async getByCallSid(callSid: string): Promise<CallAnalysis | null> {
    try {
      const call = await prisma.call.findUnique({
        where: { callSid },
        include: { analysis: true },
      });
      return call?.analysis || null;
    } catch (error) {
      console.error(`Failed to fetch analysis for callSid ${callSid}:`, error);
      return null;
    }
  },

  /**
   * Check if analysis exists for a call
   */
  async existsForCall(callId: string): Promise<boolean> {
    try {
      const count = await prisma.callAnalysis.count({
        where: { callId },
      });
      return count > 0;
    } catch (error) {
      console.error(`Failed to check analysis existence for call ${callId}:`, error);
      return false;
    }
  },

  /**
   * Delete analysis for a call (for re-analysis)
   */
  async delete(callId: string): Promise<boolean> {
    try {
      await prisma.callAnalysis.delete({
        where: { callId },
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete analysis for call ${callId}:`, error);
      return false;
    }
  },

  /**
   * Update an existing analysis
   */
  async update(callId: string, data: Partial<CreateAnalysisInput>): Promise<CallAnalysis | null> {
    try {
      return await prisma.callAnalysis.update({
        where: { callId },
        data: {
          summary: data.summary,
          sentimentOverall: data.sentimentOverall,
          sentimentTrend: data.sentimentTrend,
          sentimentScore: data.sentimentScore,
          primaryIntent: data.primaryIntent,
          secondaryIntents: data.secondaryIntents,
          entities: data.entities,
          actionItems: data.actionItems,
          urgencyScore: data.urgencyScore,
          urgencyReason: data.urgencyReason,
          leadScore: data.leadScore,
          leadScoreReason: data.leadScoreReason,
          isFaq: data.isFaq,
          faqTopic: data.faqTopic,
          resolutionStatus: data.resolutionStatus,
          topicTags: data.topicTags,
          modelUsed: data.modelUsed,
          tokensUsed: data.tokensUsed,
          processingTimeMs: data.processingTimeMs,
          language: data.language,
        },
      });
    } catch (error) {
      console.error(`Failed to update analysis for call ${callId}:`, error);
      return null;
    }
  },
};
