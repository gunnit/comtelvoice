// API client for fetching data from backend

const API_BASE = '/api';

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
  pendingCallbacks: number;
  unreadMessages: number;
  callsByDay: Record<string, number>;
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
  const response = await fetch(`${API_BASE}${endpoint}`);
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
