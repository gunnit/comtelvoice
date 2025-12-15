import 'dotenv/config';
import Fastify from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyWebsocket from '@fastify/websocket';
import { RealtimeSession } from '@openai/agents/realtime';
import { TwilioRealtimeTransportLayer } from '@openai/agents-extensions';
import { createArthurAgent, createAgentFromGlobalConfig } from './agent.js';
import type { WebSocket } from 'ws';
import { callService } from './db/services/calls.js';
import { transcriptService } from './db/services/transcripts.js';
import { callbackService } from './db/services/callbacks.js';
import { messageService } from './db/services/messages.js';
import { authService } from './db/services/auth.js';
import { userService } from './db/services/users.js';
import { authMiddleware } from './middleware/auth.js';
import {
  agentConfigService,
  loadGlobalConfig,
  updateGlobalAgentConfig,
  updateGlobalInstructions,
  updateGlobalKnowledgeBase,
  updateGlobalToolConfigs,
  getSystemUserId,
} from './db/services/agent-config.js';
import { InstructionBuilder } from './services/instruction-builder.js';
import { disconnectDatabase } from './db/index.js';
import cors from '@fastify/cors';

// Environment variables validation
const REQUIRED_ENV_VARS = ['OPENAI_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'SERVER_URL', 'PORT'];
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const SERVER_URL = process.env.SERVER_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// Transfer state management
// Stores pending transfer requests: callSid → targetNumber
// When a call's WebSocket stream closes, we check this Map to determine if it should be transferred
const pendingTransfers = new Map<string, string>();

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Register plugins
await fastify.register(fastifyFormBody);
await fastify.register(fastifyWebsocket);
await fastify.register(cors, {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://comtel-voice-dashboard.onrender.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
});

// Register authentication middleware for API routes
fastify.addHook('preHandler', authMiddleware);

/**
 * Health check endpoint
 * GET /
 */
fastify.get('/', async () => {
  return {
    status: 'healthy',
    service: 'Comtel Voice Agent',
    agent: 'Arthur',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /',
      incomingCall: 'POST /incoming-call',
      outboundCall: 'POST /outbound-call (mode: simple|agent)',
      callStatus: 'POST /call-status',
      transferComplete: 'POST /transfer-complete',
      transferStatus: 'POST /transfer-status',
      mediaStream: 'WebSocket /media-stream'
    }
  };
});

/**
 * Helper: Extract phone number from SIP URI
 * Example: "sip:+393516436038@sbc-mi-acs.comtelitalia.it;user=phone" → "+393516436038"
 */
function extractPhoneFromSip(sipUri: string | undefined): string {
  if (!sipUri) return 'unknown';
  const match = sipUri.match(/sip:(\+?\d+)@/);
  return match ? match[1] : sipUri;
}

/**
 * Twilio incoming call webhook
 * POST /incoming-call
 * Returns TwiML to establish WebSocket connection
 */
fastify.post('/incoming-call', async (_request, reply) => {
  console.log('📞 Incoming call received');
  console.log('Call details:', _request.body);

  // Extract caller information from SIP URIs
  const body = _request.body as any;
  const fromSip = body.From || body.Caller;
  const toSip = body.To || body.Called;
  const from = extractPhoneFromSip(fromSip);
  const to = extractPhoneFromSip(toSip);

  console.log('📞 Extracted phone numbers:', { from, to });

  // Twilio Stream does NOT support query parameters in the URL
  // Use Parameter elements to pass custom data instead
  const streamUrl = `wss://${SERVER_URL}/media-stream`;
  const transferCompleteUrl = `https://${SERVER_URL}/transfer-complete`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect action="${transferCompleteUrl}">
    <Stream url="${streamUrl}">
      <Parameter name="from" value="${from}" />
      <Parameter name="to" value="${to}" />
    </Stream>
  </Connect>
</Response>`;

  // Log the exact TwiML and WebSocket URL being sent to Twilio
  console.log('🔗 WebSocket URL:', streamUrl);
  console.log('📞 Passing parameters: from=' + from + ', to=' + to);
  console.log('📄 TwiML being sent to Twilio:');
  console.log(twiml);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  reply.type('text/xml').send(twiml);
});

/**
 * Outbound call webhook
 * POST /outbound-call
 * Returns TwiML for outbound calls initiated by the system
 *
 * Query parameters:
 * - mode: 'simple' (default) for basic audio, 'agent' to connect to Arthur
 */
fastify.post('/outbound-call', async (request, reply) => {
  console.log('📞 Outbound call webhook triggered');
  console.log('Request details:', request.body);

  const body = request.body as any;
  const query = request.query as any;
  const mode = query.mode || 'simple';

  const callSid = body.CallSid;
  const from = body.From;
  const to = body.To;
  const callStatus = body.CallStatus;

  console.log('📞 Outbound call details:', { callSid, from, to, callStatus, mode });

  let twiml: string;

  if (mode === 'agent') {
    // Connect to Arthur agent via WebSocket
    const streamUrl = `wss://${SERVER_URL}/media-stream`;
    const transferCompleteUrl = `https://${SERVER_URL}/transfer-complete`;

    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="it-IT">Un momento prego.</Say>
  <Connect action="${transferCompleteUrl}">
    <Stream url="${streamUrl}">
      <Parameter name="from" value="${from}" />
      <Parameter name="to" value="${to}" />
      <Parameter name="outbound" value="true" />
    </Stream>
  </Connect>
</Response>`;

    console.log('🤖 Connecting outbound call to Arthur agent');
  } else {
    // Simple test mode - play a message and hang up
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="it-IT" voice="alice">
    Ciao! Questo è un messaggio di test da Comtel Italia.
    Il sistema di chiamate in uscita funziona correttamente.
    Grazie e arrivederci!
  </Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;

    console.log('💬 Playing simple test message');
  }

  console.log('📄 TwiML response:');
  console.log(twiml);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  reply.type('text/xml').send(twiml);
});

/**
 * Call status callback
 * POST /call-status
 * Receives status updates for outbound calls
 * Events: initiated, ringing, answered, completed
 */
fastify.post('/call-status', async (request, reply) => {
  const body = request.body as any;
  const callSid = body.CallSid;
  const callStatus = body.CallStatus;
  const timestamp = body.Timestamp;
  const duration = body.CallDuration;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Call Status Update');
  console.log('⏰ Time:', timestamp);
  console.log('📞 Call SID:', callSid);
  console.log('📈 Status:', callStatus);
  if (duration) {
    console.log('⏱️  Duration:', duration, 'seconds');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Update database if call tracking is enabled
  try {
    if (callStatus === 'completed') {
      await callService.update(callSid, {
        status: 'completed',
        endedAt: new Date(),
        duration: parseInt(duration || '0', 10)
      });
      console.log('✅ Call status updated in database');
    }
  } catch (error) {
    console.error('⚠️  Failed to update call status in database:', error);
  }

  return reply.send({ received: true });
});

/**
 * Transfer completion handler
 * POST /transfer-complete
 * Called by Twilio after the WebSocket stream ends (via action attribute on <Connect>)
 * Checks if a transfer is pending and returns appropriate TwiML
 */
fastify.post('/transfer-complete', async (request, reply) => {
  const body = request.body as any;
  const callSid = body.CallSid;
  const callStatus = body.CallStatus;
  const callDuration = body.CallDuration;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 /transfer-complete endpoint called');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📞 Call SID:', callSid);
  console.log('📊 Call Status:', callStatus);
  console.log('⏱️  Call Duration:', callDuration, 'seconds');
  console.log('📋 All Twilio parameters:', JSON.stringify(body, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Save call duration to database
  if (callSid && callDuration) {
    try {
      await callService.update(callSid, {
        status: 'completed',
        endedAt: new Date(),
        duration: parseInt(callDuration, 10)
      });
      console.log('✅ Call duration saved to database:', callDuration, 'seconds');
    } catch (error) {
      console.error('❌ Failed to save call duration:', error);
    }
  }

  // Check if there's a pending transfer for this call
  const targetNumber = pendingTransfers.get(callSid);

  if (targetNumber) {
    // Transfer is pending - return BYOC Dial TwiML
    console.log('✅ Pending transfer found!');
    console.log('📞 Target number:', targetNumber);
    console.log('🔄 Initiating transfer via BYOC Dial...');

    // Clean up the pending transfer
    pendingTransfers.delete(callSid);

    // Use BYOC Dial to route call through Comtel's carrier connection
    // BYOC Trunk SID: BY4860934ef5d140355b71ab233b88dba2
    const byocTrunkSid = 'BY4860934ef5d140355b71ab233b88dba2';
    const transferTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="30">
    <Number byoc="${byocTrunkSid}">${targetNumber}</Number>
  </Dial>
</Response>`;

    console.log('📤 Returning BYOC Dial TwiML to Twilio:');
    console.log('   BYOC Trunk SID:', byocTrunkSid);
    console.log('   Target number:', targetNumber);
    console.log('   Routing via: Comtel carrier (ct-sbc-pisani)');
    console.log(transferTwiML);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return reply.type('text/xml').send(transferTwiML);
  } else {
    // No transfer pending - just hang up
    console.log('⚠️  No transfer pending for this call');
    console.log('📴 Hanging up call');

    const hangupTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;

    console.log('📤 Returning hangup TwiML to Twilio');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return reply.type('text/xml').send(hangupTwiML);
  }
});

/**
 * Transfer status handler
 * POST /transfer-status
 * Called by Twilio to report the status of a SIP REFER transfer
 */
fastify.post('/transfer-status', async (request, reply) => {
  const body = request.body as any;
  const callSid = body.CallSid;
  const referStatus = body.ReferStatus;
  const referTo = body.ReferTo;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📞 SIP REFER Transfer Status Update');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📞 Call SID:', callSid);
  console.log('📊 REFER Status:', referStatus);
  console.log('📍 REFER To:', referTo);
  console.log('📋 All Twilio parameters:', JSON.stringify(body, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Return empty TwiML - transfer is being handled by Comtel PBX
  return reply.type('text/xml').send('<Response></Response>');
});

// ============================================
// Authentication API Endpoints
// ============================================

/**
 * User login
 * POST /api/auth/login
 */
fastify.post('/api/auth/login', async (request) => {
  const { email, password } = request.body as { email: string; password: string };

  if (!email || !password) {
    return { success: false, error: 'Email e password sono richiesti' };
  }

  const result = await authService.login(email, password);
  if (!result) {
    return { success: false, error: 'Email o password non validi' };
  }

  return { success: true, data: result };
});

/**
 * User logout
 * POST /api/auth/logout
 */
fastify.post('/api/auth/logout', async (request) => {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    await authService.logout(authHeader.substring(7));
  }
  return { success: true };
});

/**
 * Get current user info
 * GET /api/auth/me
 */
fastify.get('/api/auth/me', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  const user = await authService.getUserById(request.user.userId);
  if (!user) {
    return { success: false, error: 'Utente non trovato' };
  }

  return { success: true, data: user };
});

// ============================================
// Dashboard API Endpoints (User-Filtered)
// ============================================

/**
 * Get recent calls with related data (filtered by user)
 * GET /api/calls?limit=50
 */
fastify.get('/api/calls', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  const query = request.query as { limit?: string };
  const limit = parseInt(query.limit || '50', 10);

  try {
    const calls = await callService.getRecentForUser(request.user.userId, limit);
    return { success: true, data: calls };
  } catch (error) {
    console.error('API Error - /api/calls:', error);
    return { success: false, error: 'Failed to fetch calls' };
  }
});

/**
 * Get single call with full transcript (filtered by user)
 * GET /api/calls/:callSid
 */
fastify.get('/api/calls/:callSid', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  const { callSid } = request.params as { callSid: string };

  try {
    const call = await callService.getBySidForUser(callSid, request.user.userId);
    if (!call) {
      return { success: false, error: 'Chiamata non trovata' };
    }

    // Get formatted transcript for this call
    const transcript = await transcriptService.getFormattedTranscript(callSid);
    const stats = await transcriptService.getStats(callSid);

    return {
      success: true,
      data: {
        ...call,
        formattedTranscript: transcript,
        transcriptStats: stats
      }
    };
  } catch (error) {
    console.error('API Error - /api/calls/:callSid:', error);
    return { success: false, error: 'Failed to fetch call' };
  }
});

/**
 * Search transcripts (filtered by user)
 * GET /api/transcripts/search?q=text&limit=50
 */
fastify.get('/api/transcripts/search', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  const query = request.query as { q?: string; limit?: string };
  const searchQuery = query.q || '';
  const limit = parseInt(query.limit || '50', 10);

  if (!searchQuery) {
    return { success: false, error: 'La query di ricerca è richiesta' };
  }

  try {
    const results = await transcriptService.searchTranscriptsForUser(
      request.user.userId,
      searchQuery,
      limit
    );
    return { success: true, data: results };
  } catch (error) {
    console.error('API Error - /api/transcripts/search:', error);
    return { success: false, error: 'Failed to search transcripts' };
  }
});

/**
 * Get all callbacks (filtered by user)
 * GET /api/callbacks?status=pending&limit=50
 */
fastify.get('/api/callbacks', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  const query = request.query as { status?: string; limit?: string };
  const status = query.status as 'pending' | 'scheduled' | 'completed' | 'cancelled' | undefined;
  const limit = parseInt(query.limit || '50', 10);

  try {
    let callbacks;
    if (status && ['pending', 'scheduled', 'completed', 'cancelled'].includes(status)) {
      callbacks = await callbackService.getByStatusForUser(request.user.userId, status, limit);
    } else {
      callbacks = await callbackService.getAllForUser(request.user.userId, limit);
    }
    return { success: true, data: callbacks };
  } catch (error) {
    console.error('API Error - /api/callbacks:', error);
    return { success: false, error: 'Failed to fetch callbacks' };
  }
});

/**
 * Get all messages (filtered by user)
 * GET /api/messages?status=unread&recipient=John&limit=50
 */
fastify.get('/api/messages', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  const query = request.query as { status?: string; recipient?: string; limit?: string };
  const { status, recipient } = query;
  const limit = parseInt(query.limit || '50', 10);

  try {
    let messages;
    if (recipient) {
      messages = await messageService.getByRecipientForUser(request.user.userId, recipient, limit);
    } else if (status === 'unread') {
      messages = await messageService.getUnreadForUser(request.user.userId, limit);
    } else if (status === 'urgent') {
      messages = await messageService.getUrgentForUser(request.user.userId, limit);
    } else {
      // Get all messages for user
      messages = await messageService.getAllForUser(request.user.userId, limit);
    }
    return { success: true, data: messages };
  } catch (error) {
    console.error('API Error - /api/messages:', error);
    return { success: false, error: 'Failed to fetch messages' };
  }
});

/**
 * Get dashboard statistics (filtered by user)
 * GET /api/stats
 */
fastify.get('/api/stats', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    // Get stats for user
    const userId = request.user.userId;
    const callStats = await callService.getStatsForUser(userId);
    const pendingCallbacksCount = await callbackService.countPendingForUser(userId);
    const unreadMessagesCount = await messageService.countUnreadForUser(userId);

    return {
      success: true,
      data: {
        totalCalls: callStats.totalCalls,
        completedCalls: callStats.completedCalls,
        avgDuration: callStats.avgDuration,
        pendingCallbacks: pendingCallbacksCount,
        unreadMessages: unreadMessagesCount,
        callsByDay: callStats.callsByDay
      }
    };
  } catch (error) {
    console.error('API Error - /api/stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
});

// ============================================
// End Dashboard API Endpoints
// ============================================

// ============================================
// Agent Configuration API Endpoints
// ============================================

/**
 * Get full agent configuration (SINGLETON - global config for all calls)
 * GET /api/agent-config
 */
fastify.get('/api/agent-config', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    // Use global config (singleton) - creates default if not exists
    const systemUserId = await getSystemUserId();
    const config = await agentConfigService.getOrCreate(systemUserId);
    return { success: true, data: config };
  } catch (error) {
    console.error('API Error - /api/agent-config:', error);
    return { success: false, error: 'Failed to fetch agent config' };
  }
});

/**
 * Update core agent settings (SINGLETON)
 * PUT /api/agent-config
 */
fastify.put('/api/agent-config', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const body = request.body as Partial<{
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
    }>;

    // Update global config (also refreshes cache)
    const config = await updateGlobalAgentConfig(body);
    return { success: true, data: config };
  } catch (error) {
    console.error('API Error - PUT /api/agent-config:', error);
    return { success: false, error: 'Failed to update agent config' };
  }
});

/**
 * Get agent instructions (SINGLETON)
 * GET /api/agent-config/instructions
 */
fastify.get('/api/agent-config/instructions', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const systemUserId = await getSystemUserId();
    const config = await agentConfigService.getFullConfig(systemUserId);
    return { success: true, data: config?.instructions };
  } catch (error) {
    console.error('API Error - /api/agent-config/instructions:', error);
    return { success: false, error: 'Failed to fetch instructions' };
  }
});

/**
 * Update agent instructions (SINGLETON)
 * PUT /api/agent-config/instructions
 */
fastify.put('/api/agent-config/instructions', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const body = request.body as Partial<{
      useTemplate: boolean;
      customInstructions: string;
      roleDescription: string;
      communicationStyle: string;
      languageInstructions: string;
      closingInstructions: string;
      additionalInstructions: string;
    }>;

    // Update global instructions (also refreshes cache)
    const instructions = await updateGlobalInstructions(body);
    return { success: true, data: instructions };
  } catch (error) {
    console.error('API Error - PUT /api/agent-config/instructions:', error);
    return { success: false, error: 'Failed to update instructions' };
  }
});

/**
 * Get knowledge base (SINGLETON)
 * GET /api/agent-config/knowledge
 */
fastify.get('/api/agent-config/knowledge', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const systemUserId = await getSystemUserId();
    const config = await agentConfigService.getFullConfig(systemUserId);
    return { success: true, data: config?.knowledgeBase };
  } catch (error) {
    console.error('API Error - /api/agent-config/knowledge:', error);
    return { success: false, error: 'Failed to fetch knowledge base' };
  }
});

/**
 * Update knowledge base (SINGLETON)
 * PUT /api/agent-config/knowledge
 */
fastify.put('/api/agent-config/knowledge', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const body = request.body as any; // Accept all knowledge base fields

    // Update global knowledge base (also refreshes cache)
    const knowledge = await updateGlobalKnowledgeBase(body);
    return { success: true, data: knowledge };
  } catch (error) {
    console.error('API Error - PUT /api/agent-config/knowledge:', error);
    return { success: false, error: 'Failed to update knowledge base' };
  }
});

/**
 * Get tool configurations (SINGLETON)
 * GET /api/agent-config/tools
 */
fastify.get('/api/agent-config/tools', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const systemUserId = await getSystemUserId();
    const config = await agentConfigService.getFullConfig(systemUserId);
    const availableTools = agentConfigService.getAvailableTools();

    // Merge available tools with global config
    const toolsWithDetails = availableTools.map(tool => {
      const toolConfig = config?.toolConfigs?.find(tc => tc.toolName === tool.name);
      return {
        ...tool,
        enabled: toolConfig?.enabled ?? true,
        parameters: toolConfig?.parameters,
        descriptionOverride: toolConfig?.descriptionOverride,
      };
    });

    return { success: true, data: toolsWithDetails };
  } catch (error) {
    console.error('API Error - /api/agent-config/tools:', error);
    return { success: false, error: 'Failed to fetch tool configs' };
  }
});

/**
 * Update tool configurations (SINGLETON)
 * PUT /api/agent-config/tools
 */
fastify.put('/api/agent-config/tools', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const body = request.body as Array<{
      toolName: string;
      enabled: boolean;
      parameters?: any;
    }>;

    // Update global tool configs (also refreshes cache)
    const success = await updateGlobalToolConfigs(body);
    return { success };
  } catch (error) {
    console.error('API Error - PUT /api/agent-config/tools:', error);
    return { success: false, error: 'Failed to update tool configs' };
  }
});

/**
 * Preview built instructions (SINGLETON)
 * GET /api/agent-config/instructions/preview
 */
fastify.get('/api/agent-config/instructions/preview', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const systemUserId = await getSystemUserId();
    const config = await agentConfigService.getFullConfig(systemUserId);
    if (!config) {
      return { success: false, error: 'Config not found' };
    }

    const builder = new InstructionBuilder(
      config.config,
      config.instructions,
      config.knowledgeBase
    );
    const preview = builder.build();

    return { success: true, data: { instructions: preview } };
  } catch (error) {
    console.error('API Error - /api/agent-config/instructions/preview:', error);
    return { success: false, error: 'Failed to build instructions preview' };
  }
});

/**
 * Get available template variables
 * GET /api/agent-config/instructions/variables
 */
fastify.get('/api/agent-config/instructions/variables', async (request) => {
  if (!request.user) {
    return { success: false, error: 'Non autenticato' };
  }

  return {
    success: true,
    data: {
      variables: InstructionBuilder.getAvailableVariables(),
      defaultSections: InstructionBuilder.getDefaultSections(),
    }
  };
});

// ============================================
// End Agent Configuration API Endpoints
// ============================================

/**
 * WebSocket endpoint for Twilio Media Stream
 * Handles real-time audio streaming and agent interaction
 */
fastify.register(async (fastifyInstance) => {
  fastifyInstance.get('/media-stream', { websocket: true }, async (connection) => {
    console.log('🔌 WebSocket connection established');

    const ws = connection as unknown as WebSocket;

    // Store Call SID and caller info for potential call transfers
    // Caller info will be extracted from customParameters in the 'start' event
    let callSid: string | null = null;
    let streamSid: string | null = null;  // Stream SID for sending stop event
    let callerNumber: string | null = null;  // Incoming caller's phone number
    let twilioNumber: string | null = null;  // Twilio SIP number that received the call
    let greetingTriggered = false;

    // Queue for transcript events that arrive before callSid is ready
    const pendingTranscriptEvents: any[] = [];

    try {
      // Create Twilio transport layer immediately
      // This allows the transport to handle ALL Twilio events including 'start'
      const transport = new TwilioRealtimeTransportLayer({
        twilioWebSocket: ws
      });

      // Add error handler to transport to prevent crashes
      transport.on('error', (error: any) => {
        console.error('⚠️  Transport error (handled):', error.error?.message || error.type);
      });

      // Listen for transport events to log important information
      transport.on('*', async (event: any) => {
        if (event.type === 'twilio_message') {
          const twilioEvent = event.message.event;
          switch (twilioEvent) {
            case 'start':
              // Capture Call SID and caller info for potential call transfers
              callSid = event.message.start.callSid;
              streamSid = event.message.start.streamSid;

              // Extract caller info from customParameters
              const customParams = event.message.start.customParameters || {};
              callerNumber = customParams.from?.toString() || null;
              twilioNumber = customParams.to?.toString() || null;

              console.log('🎬 Media stream started');
              console.log('Stream SID:', streamSid);
              console.log('Call SID:', callSid);
              console.log('📞 Caller info:', { from: callerNumber, to: twilioNumber });
              console.log('📌 Call state captured in memory for transfer functionality (including streamSid)');

              // Save call to database with user association
              if (callSid) {
                try {
                  // Look up user by the 'to' phone number
                  let userId: string | undefined;
                  if (twilioNumber) {
                    const user = await userService.getUserByPhoneNumber(twilioNumber);
                    if (user) {
                      userId = user.id;
                      currentUserId = user.id;  // Store for call state
                      console.log('📊 Call associated with user:', user.email);
                      // TODO: Load user's agent configuration dynamically
                      // For now, using default Arthur agent for all users
                    }
                  }

                  await callService.create({
                    callSid,
                    streamSid: streamSid || undefined,
                    from: callerNumber || 'unknown',
                    to: twilioNumber || undefined,
                    userId,
                  });
                  console.log('📊 Call saved to database:', callSid, userId ? `(user: ${userId})` : '(no user)');
                } catch (error) {
                  console.error('⚠️  Failed to save call to database:', error);
                }

                // Process any transcript events that were queued before callSid was ready
                if (pendingTranscriptEvents.length > 0) {
                  console.log(`📝 Processing ${pendingTranscriptEvents.length} queued transcript events`);
                  for (const queuedEvent of pendingTranscriptEvents) {
                    try {
                      if (queuedEvent.type === 'conversation.item.input_audio_transcription.completed') {
                        const transcript = queuedEvent.transcript;
                        console.log('📝 [QUEUED] USER said:', transcript);
                        if (transcript) {
                          await transcriptService.save({
                            callSid,
                            speaker: 'user',
                            text: transcript,
                            eventType: 'input_audio_transcription.completed',
                          });
                        }
                      }
                      if (queuedEvent.type === 'response.audio_transcript.done') {
                        console.log('🔊 [QUEUED] AGENT said:', queuedEvent.transcript);
                        if (queuedEvent.transcript) {
                          await transcriptService.save({
                            callSid,
                            speaker: 'agent',
                            agentName: 'Arthur',
                            text: queuedEvent.transcript,
                            eventType: 'response.audio_transcript.done',
                          });
                        }
                      }
                    } catch (queueError) {
                      console.error('⚠️  Failed to process queued transcript:', queueError);
                    }
                  }
                  // Clear the queue
                  pendingTranscriptEvents.length = 0;
                  console.log('✅ Queued transcript events processed');
                }
              }

              // Greeting will be triggered after OpenAI connection is established
              // (see code after session.connect() below)
              break;
            case 'stop':
              console.log('🛑 Media stream stopped');
              if (callSid) {
                console.log(`📞 Call ${callSid} - media stream ended`);

                // Update call status to completed
                try {
                  await callService.update(callSid, {
                    status: 'completed',
                    endedAt: new Date(),
                  });
                  console.log('📊 Call status updated to completed:', callSid);
                } catch (error) {
                  console.error('⚠️  Failed to update call status:', error);
                }
              }
              break;
            case 'mark':
              if (!event.message.mark.name.includes(':')) {
                console.log('📍 Mark event:', event.message.mark.name);
              }
              break;
          }
        }
      });

      // Variables for dynamic agent configuration
      let realtimeSession: any = null;
      let currentUserId: string | null = null;

      // Create agent dynamically based on user configuration
      // For now, use default agent since we need to wait for userId from 'start' event
      // We'll check if user config is available when userId is determined
      const getCallState = () => ({
        callSid,
        callerNumber,
        twilioNumber,
        streamSid,
        session: realtimeSession,
        twilioWebSocket: ws,
        storePendingTransfer: (sid: string, target: string) => {
          pendingTransfers.set(sid, target);
        },
        userId: currentUserId,
      });

      // Create agent from global config (or fall back to default)
      const dynamicResult = createAgentFromGlobalConfig(getCallState);
      const agent = dynamicResult?.agent || createArthurAgent(getCallState);
      const activeConfig = dynamicResult?.config || null;

      if (dynamicResult) {
        console.log('🤖 Using configured agent:');
        console.log(`   - Name: ${activeConfig?.config.agentName}`);
        console.log(`   - Voice: ${activeConfig?.config.voice}`);
        console.log(`   - Greeting: "${activeConfig?.config.greetingMessage}"`);
      } else {
        console.log('🤖 Using default Arthur agent (no config cached)');
      }

      // Create Realtime session with Twilio transport
      // Enable user audio transcription via config
      const session = new RealtimeSession(agent, {
        transport,
        model: 'gpt-realtime',
        config: {
          inputAudioTranscription: {
            model: 'gpt-4o-transcribe'
            // No language hint - auto-detect for multilingual support
          }
        }
      });

      // Make session available to transfer tool via callState
      realtimeSession = session;

      // Add error handler to session to prevent crashes
      session.on('error', (error: any) => {
        // Log the error but don't crash the server
        console.error('⚠️  Session error (handled):', error.error?.error?.code || error.type);

        // Only log full details for non-cancellation errors
        if (error.error?.error?.code !== 'response_cancel_not_active') {
          console.error('Error details:', JSON.stringify(error, null, 2));
        }
      });

      // Connect to OpenAI Realtime API
      // This will also set up all the transport layer's message handlers
      await session.connect({
        apiKey: OPENAI_API_KEY
      });
      console.log('✅ Connected to OpenAI Realtime API');
      console.log('📝 Transcript logging enabled (gpt-4o-transcribe, auto-detect language)');
      console.log('🔐 Financial data protection: Access code verification enabled');

      // Trigger greeting after OpenAI connection is established
      // Wait for Twilio 'start' event to be processed (so we have callSid)
      // Use config values or defaults
      const greetingDelayMs = activeConfig?.config?.greetingDelayMs || 200;
      const greetingMessage = activeConfig?.config?.greetingMessage || 'Ciao';

      setTimeout(async () => {
        if (!greetingTriggered && callSid) {
          greetingTriggered = true;

          console.log('🎙️  Triggering initial greeting (after OpenAI connected + Twilio ready)');

          // Send a user message asking the agent to greet
          // This triggers the agent to respond with audio (not just text)
          session.transport.sendEvent({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{
                type: 'input_text',
                text: greetingMessage
              }]
            }
          });
          session.transport.sendEvent({
            type: 'response.create'
          });

          console.log('✅ Greeting trigger sent - agent will respond with audio');
        } else if (!callSid) {
          console.warn('⚠️  Cannot send greeting: callSid not set yet');
        }
      }, greetingDelayMs);

      // Listen for all session events to capture transcripts
      console.log('📝 Setting up transcript event listeners');

      // Helper function to process a single transcript event
      const processTranscriptEvent = async (event: any, currentCallSid: string) => {
        try {
          // Handle user audio transcription completed
          if (event.type === 'conversation.item.input_audio_transcription.completed') {
            const transcript = event.transcript;
            console.log('📝 USER said:', transcript);

            if (transcript) {
              const saved = await transcriptService.save({
                callSid: currentCallSid,
                speaker: 'user',
                text: transcript,
                eventType: 'input_audio_transcription.completed',
              });

              if (saved) {
                console.log('✅ User transcript saved to database');
              } else {
                console.error('❌ Failed to save user transcript to database');
              }
            }
          }

          // Handle response audio transcript done (complete agent transcripts)
          if (event.type === 'response.audio_transcript.done') {
            console.log('🔊 AGENT said:', event.transcript);

            if (event.transcript) {
              const saved = await transcriptService.save({
                callSid: currentCallSid,
                speaker: 'agent',
                agentName: 'Arthur',
                text: event.transcript,
                eventType: 'response.audio_transcript.done',
              });

              if (saved) {
                console.log('✅ Agent audio transcript saved to database');
              } else {
                console.error('❌ Failed to save agent audio transcript to database');
              }
            }
          }
        } catch (error) {
          console.error('⚠️  Failed to process transcript event:', {
            eventType: event.type,
            error: error instanceof Error ? error.message : error
          });
        }
      };

      // Listen on transport layer for raw OpenAI events (transcripts, audio, etc.)
      // Note: session.on('*') only emits high-level events, transport.on('*') gets raw events
      session.transport.on('*', async (event: any) => {
        // Log important transcript events for debugging
        const transcriptEvents = [
          'conversation.item.input_audio_transcription.completed',
          'conversation.item.input_audio_transcription.delta',
          'response.audio_transcript.delta',
          'response.audio_transcript.done'
        ];

        if (transcriptEvents.includes(event.type)) {
          console.log(`🔊 Transcript event: ${event.type}`, {
            hasCallSid: !!callSid,
            hasTranscript: !!event.transcript,
            transcriptPreview: event.transcript?.substring(0, 50) || event.delta?.substring(0, 50)
          });
        }

        // Queue transcript events if callSid is not ready yet
        if (!callSid) {
          if (transcriptEvents.includes(event.type)) {
            console.log('⏳ Queueing transcript event (callSid not ready):', event.type);
            pendingTranscriptEvents.push(event);
          }
          return;
        }

        // Process transcript events
        if (transcriptEvents.includes(event.type)) {
          await processTranscriptEvent(event, callSid);
        }
      });

      // Greeting is now triggered event-driven in the 'start' event handler above
      // No polling interval needed

      // Handle WebSocket errors
      ws.on('error', (error: Error) => {
        console.error('❌ WebSocket error:', error);
      });

      // Handle WebSocket close
      ws.on('close', async () => {
        console.log('🔌 WebSocket connection closed');
      });
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      ws.close();
    }
  });
});

/**
 * Start the server
 */
const start = async () => {
  try {
    // Load global agent config at startup
    console.log('\n🔧 Loading agent configuration...');
    const globalConfig = await loadGlobalConfig();
    if (globalConfig) {
      console.log(`✅ Agent config loaded: ${globalConfig.config.agentName}`);
    } else {
      console.log('⚠️ Using default agent configuration');
    }

    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log('\n🚀 Comtel Voice Agent Server Started\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Server URL: https://${SERVER_URL}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Available Endpoints:');
    console.log(`  - Health Check: GET https://${SERVER_URL}/`);
    console.log(`  - Incoming Call: POST https://${SERVER_URL}/incoming-call`);
    console.log(`  - Transfer Complete: POST https://${SERVER_URL}/transfer-complete`);
    console.log(`  - Media Stream: WSS wss://${SERVER_URL}/media-stream`);
    console.log('\n🤖 Agent Configuration:');
    if (globalConfig) {
      console.log(`   - Name: ${globalConfig.config.agentName}`);
      console.log(`   - Voice: ${globalConfig.config.voice}`);
      console.log(`   - Tools: ${globalConfig.toolConfigs.filter(t => t.enabled).length} enabled`);
      console.log(`   - Financial Access: ${globalConfig.knowledgeBase?.financialAccessEnabled ? 'Enabled' : 'Disabled'}`);
    } else {
      console.log('   - Using default Arthur agent');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Configure Twilio webhook:');
    console.log(`   https://${SERVER_URL}/incoming-call\n`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const shutdown = async () => {
  console.log('\n\n🛑 Shutting down server...');
  try {
    await fastify.close();
    console.log('✅ Server closed gracefully');

    // Disconnect from database
    await disconnectDatabase();

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Start the server
start();
