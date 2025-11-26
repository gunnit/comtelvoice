import 'dotenv/config';
import Fastify from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyWebsocket from '@fastify/websocket';
import { RealtimeSession } from '@openai/agents/realtime';
import { TwilioRealtimeTransportLayer } from '@openai/agents-extensions';
import { createArthurAgent } from './agent.js';
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

      // Create Arthur agent with full capabilities (general + financial)
      // Pass call state getter function for transfer functionality
      // Note: session will be set after it's created below
      let realtimeSession: any = null;
      const arthurAgent = createArthurAgent(() => ({
        callSid,
        callerNumber,
        twilioNumber,
        streamSid,
        session: realtimeSession,
        twilioWebSocket: ws,  // Pass WebSocket reference for manual closure
        storePendingTransfer: (sid: string, target: string) => {
          pendingTransfers.set(sid, target);
        }
      }));

      console.log('🤖 Unified agent system initialized:');
      console.log('   - Arthur (Receptionist + Financial Assistant)');
      console.log('   - All-in-one: General inquiries + Financial data (with access code)');

      // Create Realtime session with Twilio transport
      // Enable user audio transcription via config
      const session = new RealtimeSession(arthurAgent, {
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
      // Wait 200ms to ensure Twilio 'start' event has been processed (so we have callSid)
      setTimeout(() => {
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
                text: 'Ciao'  // Simple greeting to trigger agent's response
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
      }, 200);

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

      (session as any).on('*', async (event: any) => {
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
    console.log('   - Arthur (All-in-One Agent)');
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
