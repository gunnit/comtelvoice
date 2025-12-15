// API client for fetching data from backend
import { getAuthToken, useAuth } from './auth';

// In production, use full API URL; in development, proxy handles /api
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export interface Call {
  id: string;
  callSid: string;
  streamSid?: string;
  from: string;
  to?: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  callbacks?: Callback[];
  messages?: Message[];
}

export interface Transcript {
  id: string;
  speaker: string;
  agentName?: string;
  text: string;
  sequenceNumber: number;
  timestamp: string;
  confidence?: number;
  callId: string;
}

export interface Callback {
  id: string;
  referenceNumber: string;
  callerName: string;
  callerPhone: string;
  preferredTime: string;
  reason?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdAt: string;
  scheduledFor?: string;
  completedAt?: string;
  callId?: string;
}

export interface Message {
  id: string;
  referenceNumber: string;
  recipientName: string;
  callerName: string;
  callerPhone: string;
  content: string;
  urgent: boolean;
  status: string;
  priority: string;
  forwardedTo?: string;
  createdAt: string;
  readAt?: string;
  forwardedAt?: string;
  callId?: string;
}

export interface Stats {
  totalCalls: number;
  completedCalls: number;
  avgDuration: number;
  totalMinutes: number;
  pendingCallbacks: number;
  unreadMessages: number;
  callsByDay: Record<string, number>;
  durationByDay: Record<string, number>;
}

export interface CallDetail extends Call {
  formattedTranscript: string;
  transcriptStats: {
    totalMessages: number;
    userMessages: number;
    agentMessages: number;
    avgUserLength: number;
    avgAgentLength: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Clear auth state and redirect to login
    useAuth.getState().logout();
    throw new Error('Sessione scaduta');
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }

  return json.data as T;
}

export async function getCalls(limit = 50): Promise<Call[]> {
  return fetchApi<Call[]>(`/calls?limit=${limit}`);
}

export async function getCall(callSid: string): Promise<CallDetail> {
  return fetchApi<CallDetail>(`/calls/${callSid}`);
}

export async function searchTranscripts(query: string, limit = 50): Promise<Transcript[]> {
  return fetchApi<Transcript[]>(`/transcripts/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function getCallbacks(status?: string, limit = 50): Promise<Callback[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('limit', limit.toString());
  return fetchApi<Callback[]>(`/callbacks?${params}`);
}

export async function getMessages(status?: string, recipient?: string, limit = 50): Promise<Message[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (recipient) params.set('recipient', recipient);
  params.set('limit', limit.toString());
  return fetchApi<Message[]>(`/messages?${params}`);
}

export async function getStats(): Promise<Stats> {
  return fetchApi<Stats>('/stats');
}

// ============================================
// Agent Configuration Types
// ============================================

export interface AgentConfig {
  id: string;
  agentName: string;
  voice: string;
  temperature: number;
  model: string;
  turnDetectionEnabled: boolean;
  vadThreshold: number;
  silenceDurationMs: number;
  prefixPaddingMs: number;
  greetingMessage: string;
  greetingDelayMs: number;
  primaryLanguage: string;
  autoDetectLanguage: boolean;
  transcriptionModel: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentInstructions {
  id: string;
  useTemplate: boolean;
  customInstructions?: string;
  roleDescription?: string;
  communicationStyle?: string;
  languageInstructions?: string;
  closingInstructions?: string;
  additionalInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBase {
  id: string;
  companyName?: string;
  companyTagline?: string;
  companyDescription?: string;
  companyMission?: string;
  phoneMain?: string;
  phoneSupport?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  region?: string;
  country?: string;
  directions?: string;
  businessHours?: Record<string, string>;
  timezone?: string;
  holidayNote?: string;
  services?: string[];
  businessAreas?: string[];
  partners?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  transferNumberMain?: string;
  transferNumberSupport?: string;
  financialAccessEnabled?: boolean;
  financialAccessCodes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ToolConfig {
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  parameters?: any;
  descriptionOverride?: string;
}

export interface FullAgentConfig {
  config: AgentConfig;
  instructions: AgentInstructions | null;
  knowledgeBase: KnowledgeBase | null;
  toolConfigs: ToolConfig[];
}

// ============================================
// Agent Configuration API Functions
// ============================================

/**
 * Helper for mutation requests (PUT, POST, DELETE)
 */
async function fetchApiMutation<T>(
  endpoint: string,
  method: 'PUT' | 'POST' | 'DELETE',
  data?: any
): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    useAuth.getState().logout();
    throw new Error('Sessione scaduta');
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }

  return json.data as T;
}

/**
 * Get full agent configuration
 */
export async function getAgentConfig(): Promise<FullAgentConfig> {
  return fetchApi<FullAgentConfig>('/agent-config');
}

/**
 * Update core agent settings
 */
export async function updateAgentConfig(
  data: Partial<Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<AgentConfig> {
  return fetchApiMutation<AgentConfig>('/agent-config', 'PUT', data);
}

/**
 * Update agent instructions
 */
export async function updateInstructions(
  data: Partial<Omit<AgentInstructions, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<AgentInstructions> {
  return fetchApiMutation<AgentInstructions>('/agent-config/instructions', 'PUT', data);
}

/**
 * Update knowledge base
 */
export async function updateKnowledgeBase(
  data: Partial<Omit<KnowledgeBase, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<KnowledgeBase> {
  return fetchApiMutation<KnowledgeBase>('/agent-config/knowledge', 'PUT', data);
}

/**
 * Get tool configurations
 */
export async function getToolConfigs(): Promise<ToolConfig[]> {
  return fetchApi<ToolConfig[]>('/agent-config/tools');
}

/**
 * Update tool configurations (bulk)
 */
export async function updateToolConfigs(
  tools: Array<{ toolName: string; enabled: boolean; parameters?: any }>
): Promise<boolean> {
  await fetchApiMutation<{ success: boolean }>('/agent-config/tools', 'PUT', tools);
  return true;
}

/**
 * Preview built instructions
 */
export async function previewInstructions(): Promise<string> {
  const result = await fetchApi<{ instructions: string }>('/agent-config/instructions/preview');
  return result.instructions;
}

/**
 * Get available template variables
 */
export async function getTemplateVariables(): Promise<{
  variables: string[];
  defaultSections: {
    communicationStyle: string;
    languageInstructions: string;
    closingInstructions: string;
  };
}> {
  return fetchApi('/agent-config/instructions/variables');
}

/**
 * Mark callback as completed
 */
export async function markCallbackComplete(referenceNumber: string): Promise<Callback> {
  return fetchApiMutation<Callback>(`/callbacks/${referenceNumber}/complete`, 'PUT', {});
}

/**
 * Cancel callback
 */
export async function cancelCallback(referenceNumber: string): Promise<Callback> {
  return fetchApiMutation<Callback>(`/callbacks/${referenceNumber}/cancel`, 'PUT', {});
}

/**
 * Mark message as read
 */
export async function markMessageRead(referenceNumber: string): Promise<Message> {
  return fetchApiMutation<Message>(`/messages/${referenceNumber}/read`, 'PUT', {});
}
