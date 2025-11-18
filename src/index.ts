import 'dotenv/config';
import Fastify from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyWebsocket from '@fastify/websocket';
import { RealtimeSession } from '@openai/agents/realtime';
import { TwilioRealtimeTransportLayer } from '@openai/agents-extensions';
import { createMathiasAgent } from './agent.js';
import type { WebSocket } from 'ws';
import { callService } from './db/services/calls.js';
import { transcriptService } from './db/services/transcripts.js';
import { disconnectDatabase } from './db/index.js';

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

/**
 * Health check endpoint
 * GET /
 */
fastify.get('/', async () => {
  return {
    status: 'healthy',
    service: 'Comtel Voice Agent',
    agent: 'Mathias',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /',
      incomingCall: 'POST /incoming-call',
      transferComplete: 'POST /transfer-complete',
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
 * Transfer completion handler
 * POST /transfer-complete
 * Called by Twilio after the WebSocket stream ends (via action attribute on <Connect>)
 * Checks if a transfer is pending and returns appropriate TwiML
 */
fastify.post('/transfer-complete', async (request, reply) => {
  const body = request.body as any;
  const callSid = body.CallSid;

  console.log('🔄 Transfer completion check for call:', callSid);

  // Check if there's a pending transfer for this call
  const targetNumber = pendingTransfers.get(callSid);

  if (targetNumber) {
    // Transfer is pending - return Dial TwiML
    console.log('✅ Pending transfer found, dialing:', targetNumber);

    // Clean up the pending transfer
    pendingTransfers.delete(callSid);

    const transferTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="30">${targetNumber}</Dial>
</Response>`;

    console.log('📞 Returning transfer TwiML:', transferTwiML);
    return reply.type('text/xml').send(transferTwiML);
  } else {
    // No transfer pending - just hang up
    console.log('📴 No transfer pending, hanging up call');

    const hangupTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;

    return reply.type('text/xml').send(hangupTwiML);
  }
});

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
    let callerNumber: string | null = null;  // Incoming caller's phone number
    let twilioNumber: string | null = null;  // Twilio SIP number that received the call
    let greetingTriggered = false;

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
              const streamSid = event.message.start.streamSid;

              // Extract caller info from customParameters
              const customParams = event.message.start.customParameters || {};
              callerNumber = customParams.from?.toString() || null;
              twilioNumber = customParams.to?.toString() || null;

              console.log('🎬 Media stream started');
              console.log('Stream SID:', streamSid);
              console.log('Call SID:', callSid);
              console.log('📞 Caller info:', { from: callerNumber, to: twilioNumber });
              console.log('📌 Call state captured in memory for transfer functionality');

              // Save call to database (but transfer won't depend on this)
              if (callSid) {
                try {
                  await callService.create({
                    callSid,
                    streamSid: streamSid || undefined,
                    from: callerNumber || 'unknown',
                    to: twilioNumber || undefined,
                  });
                  console.log('📊 Call saved to database:', callSid);
                } catch (error) {
                  console.error('⚠️  Failed to save call to database:', error);
                }
              }
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

      // Create Mathias agent with full capabilities (general + financial)
      // Pass call state getter function for transfer functionality
      // Note: session will be set after it's created below
      let realtimeSession: any = null;
      const mathiasAgent = createMathiasAgent(() => ({
        callSid,
        callerNumber,
        twilioNumber,
        session: realtimeSession,
        storePendingTransfer: (sid: string, target: string) => {
          pendingTransfers.set(sid, target);
        }
      }));

      console.log('🤖 Unified agent system initialized:');
      console.log('   - Mathias (Receptionist + Financial Assistant)');
      console.log('   - All-in-one: General inquiries + Financial data (with access code)');

      // Create Realtime session with Twilio transport
      // Enable user audio transcription via config
      const session = new RealtimeSession(mathiasAgent, {
        transport,
        model: 'gpt-realtime',
        config: {
          inputAudioTranscription: {
            model: 'gpt-4o-transcribe',
            language: 'it'  // Italian language hint for better accuracy
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
      console.log('📝 Transcript logging enabled (gpt-4o-transcribe, Italian)');
      console.log('🔐 Financial data protection: Access code verification enabled');

      // Listen for all session events to capture transcripts
      console.log('📝 Setting up transcript event listeners');

      (session as any).on('*', async (event: any) => {
        // Log ALL events for debugging (with filtering for noise)
        const eventTypesToLog = [
          'conversation.item.input_audio_transcription.completed',
          'conversation.item.created',
          'response.text.delta',
          'response.audio_transcript.delta',
          'response.audio_transcript.done',
          'response.done'
        ];

        if (eventTypesToLog.includes(event.type)) {
          console.log(`🔊 Session event received: ${event.type}`, {
            hasCallSid: !!callSid,
            callSid: callSid || 'not-set-yet'
          });
        }

        if (!callSid) {
          // Log warning if transcript events arrive before callSid is set
          if (event.type.includes('transcript') || event.type.includes('conversation')) {
            console.warn('⚠️  Transcript event received but callSid not set yet:', event.type);
          }
          return; // Only log if we have a callSid
        }

        try {
          // Handle user audio transcription completed
          if (event.type === 'conversation.item.input_audio_transcription.completed') {
            const transcript = event.transcript;
            console.log('📝 User transcription completed:', {
              transcript: transcript?.substring(0, 50),
              callSid
            });

            if (transcript) {
              const saved = await transcriptService.save({
                callSid,
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

          // Handle conversation items (agent responses, user messages)
          if (event.type === 'conversation.item.created') {
            const item = event.item;
            console.log('📝 Conversation item created:', {
              role: item.role,
              contentTypes: item.content?.map((c: any) => c.type),
              callSid
            });

            // Agent text responses
            if (item.role === 'assistant' && item.content) {
              for (const content of item.content) {
                if (content.type === 'text' && content.text) {
                  console.log('📝 Saving agent text response:', content.text.substring(0, 50));
                  const saved = await transcriptService.save({
                    callSid,
                    speaker: 'agent',
                    agentName: 'Mathias',
                    text: content.text,
                    eventType: 'conversation.item.created',
                  });

                  if (saved) {
                    console.log('✅ Agent transcript saved to database');
                  } else {
                    console.error('❌ Failed to save agent transcript to database');
                  }
                }
              }
            }

            // User messages (text-based)
            if (item.role === 'user' && item.content) {
              for (const content of item.content) {
                if (content.type === 'input_text' && content.text) {
                  console.log('📝 Saving user text message:', content.text.substring(0, 50));
                  const saved = await transcriptService.save({
                    callSid,
                    speaker: 'user',
                    text: content.text,
                    eventType: 'conversation.item.created',
                  });

                  if (saved) {
                    console.log('✅ User message saved to database');
                  } else {
                    console.error('❌ Failed to save user message to database');
                  }
                }
              }
            }
          }

          // Handle response audio transcript delta (streaming transcripts)
          if (event.type === 'response.audio_transcript.delta') {
            console.log('🔊 Audio transcript delta received:', {
              delta: event.delta?.substring(0, 30),
              itemId: event.item_id
            });
          }

          // Handle response audio transcript done (complete transcripts)
          if (event.type === 'response.audio_transcript.done') {
            console.log('🔊 Audio transcript done:', {
              transcript: event.transcript?.substring(0, 50),
              itemId: event.item_id
            });

            if (event.transcript) {
              const saved = await transcriptService.save({
                callSid,
                speaker: 'agent',
                agentName: 'Mathias',
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
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      });

      // Trigger greeting after media stream starts (once only)
      // Wait for the transport 'start' event before triggering greeting
      const checkAndGreet = setInterval(() => {
        if (callSid && !greetingTriggered) {
          greetingTriggered = true;

          // Use low-level transport events to avoid interruption issues
          session.transport.sendEvent({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{
                type: 'input_text',
                text: 'Saluta il cliente'  // Italian: "Greet the customer"
              }]
            }
          });
          session.transport.sendEvent({
            type: 'response.create'
          });

          console.log('🎙️  Initial greeting triggered (after media stream started)');
          clearInterval(checkAndGreet);
        }
      }, 100);

      // Cleanup interval after 5 seconds if greeting hasn't triggered
      setTimeout(() => {
        clearInterval(checkAndGreet);
      }, 5000);

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
    console.log('\n🤖 Unified Agent System:');
    console.log('   - Mathias (All-in-One Agent)');
    console.log('   - Capabilities: General inquiries + Financial data');
    console.log('   - Security: Access code verification for financial data');
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
