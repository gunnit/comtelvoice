import 'dotenv/config';
import Fastify from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyWebsocket from '@fastify/websocket';
import { RealtimeSession } from '@openai/agents/realtime';
import { TwilioRealtimeTransportLayer } from '@openai/agents-extensions';
import { createMathiasAgent } from './agent.js';
import { createElenaAgent } from './financial-agent.js';
import type { WebSocket } from 'ws';

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
      mediaStream: 'WebSocket /media-stream'
    }
  };
});

/**
 * Twilio incoming call webhook
 * POST /incoming-call
 * Returns TwiML to establish WebSocket connection
 */
fastify.post('/incoming-call', async (_request, reply) => {
  console.log('📞 Incoming call received');
  console.log('Call details:', _request.body);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${SERVER_URL}/media-stream" />
  </Connect>
</Response>`;

  reply.type('text/xml').send(twiml);
});

/**
 * WebSocket endpoint for Twilio Media Stream
 * Handles real-time audio streaming and agent interaction
 */
fastify.register(async (fastifyInstance) => {
  fastifyInstance.get('/media-stream', { websocket: true }, async (connection) => {
    console.log('🔌 WebSocket connection established');

    const ws = connection as unknown as WebSocket;

    // Store Call SID for potential call transfers
    let callSid: string | null = null;

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
      transport.on('*', (event: any) => {
        if (event.type === 'twilio_message') {
          const twilioEvent = event.message.event;
          switch (twilioEvent) {
            case 'start':
              // Capture Call SID for potential call transfers
              callSid = event.message.start.callSid;
              console.log('🎬 Media stream started');
              console.log('Stream SID:', event.message.start.streamSid);
              console.log('Call SID:', callSid);
              console.log('📌 Call SID captured for transfer functionality');
              break;
            case 'stop':
              console.log('🛑 Media stream stopped');
              if (callSid) {
                console.log(`📞 Call ${callSid} - media stream ended`);
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

      // Create both agents - Elena first, then Mathias with handoff to Elena
      const elenaAgent = createElenaAgent();
      const mathiasAgent = createMathiasAgent(() => callSid, [elenaAgent]);

      console.log('👥 Multi-agent system initialized:');
      console.log('   - Mathias (Receptionist) - Active');
      console.log('   - Elena (Financial) - Handoff target');

      // Create Realtime session with Twilio transport
      // Starting with Mathias, with Elena available for handoffs
      const session = new RealtimeSession(mathiasAgent, {
        transport,
        model: 'gpt-realtime'
      });

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
      console.log('🔄 Handoff system ready: Mathias ↔ Elena');

      // Trigger initial greeting from the agent
      // This causes Mathias to introduce himself instead of waiting for the caller
      session.sendMessage('chiamata in arrivo');
      console.log('🎙️  Initial greeting triggered');

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
    console.log(`  - Media Stream: WSS wss://${SERVER_URL}/media-stream`);
    console.log('\n🤖 Multi-Agent System:');
    console.log('   - Mathias (Receptionist) - Primary agent');
    console.log('   - Elena (Financial) - Handoff target for financial queries');
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
