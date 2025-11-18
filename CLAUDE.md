# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Twilio voice agent for **Comtel Italia** (an Italian ICT systems integration company) powered by OpenAI's Realtime API. The agent "Mathias" acts as an Italian-speaking receptionist handling incoming calls, providing company information, taking messages, and scheduling callbacks. The agent also provides **financial data access** (balance sheets, KPIs, revenues) after verifying an access code.

**Critical Context**: All agent responses and prompts are in **Italian**. The company is based in Milan, Italy, not in the US.

## Development Commands

```bash
# Development with hot-reload (preferred for local testing)
npm run dev

# Build TypeScript to dist/
npm run build

# Production start (requires build first)
npm start

# Database management
docker compose up -d              # Start PostgreSQL
npx prisma studio                 # Visual database browser (http://localhost:5555)
npx prisma migrate dev            # Run migrations in development
npx prisma migrate deploy         # Run migrations in production
npx prisma generate               # Regenerate Prisma client after schema changes
```

## Deployment Strategy

- **Local Development**: Test locally using `npm run dev` with ngrok tunnel
- **Production Deployment**: Render.com (service ID: `srv-d2u2ih15pdvs73a2dge0`)
- **Service URL**: https://comtel-voice-agent.onrender.com
- **Important**: Backend must remain on Render.com because Twilio webhooks require a public URL (cannot use localhost)

### Deploying to Render

Only deploy when explicitly requested by the user. Render auto-deploys on push to main branch if GitHub integration is set up.

## Architecture Overview

### Request Flow
```
Phone Call → Twilio → POST /incoming-call (returns TwiML)
          → WebSocket /media-stream
          → TwilioRealtimeTransportLayer
          → OpenAI Realtime API (model: gpt-realtime)
          → Mathias Agent + Tools
          → Audio Response
```

### Core Components

1. **src/index.ts**: Fastify server with three key endpoints:
   - Health check endpoint: `GET /`
   - Twilio webhook handler: `POST /incoming-call` (returns TwiML with WebSocket URL)
   - WebSocket media stream: `/media-stream` (handles real-time audio with OpenAI)
   - **Key integration**: Tracks calls, saves transcripts to database, manages session lifecycle

2. **src/agent.ts**: Agent configuration (unified Mathias agent)
   - Contains `MATHIAS_INSTRUCTIONS` (in Italian) - the system prompt
   - Configures voice: "verse"
   - Model: `gpt-realtime` (NOT `gpt-4o-realtime-preview`)
   - Turn detection: Server VAD with 0.5 threshold, 500ms silence duration
   - **Critical**: Access code protection for financial data queries

3. **src/tools.ts**: General receptionist tools (6 tools):
   - `get_company_info`: Real Comtel Italia details (services, contact info, partners)
   - `get_business_hours`: Italian business hours (CET/CEST timezone)
   - `get_location`: Milan office address (Via Vittor Pisani, 10, Milano)
   - `schedule_callback`: Records callback requests → **saves to database** (callbacks table)
   - `take_message`: Takes messages for employees → **saves to database** (messages table)
   - `transfer_call`: Transfers active calls by closing WebSocket and updating TwiML → **Important**: Must close session first

4. **src/financial-tools.ts**: Financial data tools (5 tools):
   - `verify_access_code`: Verifies caller authorization (required before accessing financial data)
   - `get_financial_summary`: Overview of fiscal year 2024
   - `get_balance_sheet`: Detailed balance sheet data
   - `get_income_statement`: Revenue, costs, margins, EBITDA
   - `get_business_lines`: Revenue breakdown by service line
   - **Data source**: `src/data/financial-data.json`

5. **Database Layer** (`src/db/`):
   - `index.ts`: Prisma client singleton with auto-disconnect
   - `services/calls.ts`: Call tracking (create, update, list)
   - `services/callbacks.ts`: Callback requests with reference numbers (RIC-xxxxx)
   - `services/messages.ts`: Messages with reference numbers (MSG-xxxxx)
   - `services/transcripts.ts`: Conversation transcripts (user & agent speech)

### Important Technical Details

- **Module System**: ESM (type: "module" in package.json)
- **Import Extensions**: Always use `.js` extension in imports (e.g., `./tools.js`) even though source is `.ts` - this is required for ESM
- **Audio Format**: g711_ulaw (automatically configured by TwilioRealtimeTransportLayer)
- **Transcription Model**: `gpt-4o-transcribe` with Italian language hint (`language: 'it'`) configured in RealtimeSession config
- **Error Handling**: Both transport and session have error handlers to prevent crashes. Response cancellation errors are expected and suppressed.
- **Database**: PostgreSQL via Prisma ORM. App gracefully degrades to console logging if database is unavailable.
- **Financial Data Security**: Access codes stored in `financial-tools.ts` (use environment variables in production)
- **Call Transfer Architecture**: Uses a 3-step process: (1) Close OpenAI session with `session.close()`, (2) Wait 200ms for WebSocket closure, (3) Update call with `<Dial>` TwiML via Twilio REST API. This is necessary because calls in `<Connect><Stream>` cannot be updated while WebSocket is active.

### OpenAI Agents API Reference

- **Official Documentation**: https://openai.github.io/openai-agents-js/openai/agents/readme/#classes
- Always reference this URL for the latest API methods, classes, and interfaces
- Key classes: RealtimeSession, RealtimeAgent, TwilioRealtimeTransportLayer
- Important: Use `sendMessage()` not `sendUserMessage()` for sending messages to the session
- **Transcription Configuration**: Pass `inputAudioTranscription` in the `config` object during RealtimeSession creation (NOT via sendMessage after connection)

## Real Company Information (Comtel Italia)

When modifying agent instructions or tools, use these accurate details:

- **Company**: Comtel Italia - ICT systems integration leader (20+ years)
- **Location**: Via Vittor Pisani, 10, 20124 Milano, Italia
- **Phone**: +39 02 2052781
- **Support**: +39 800 200 960 (toll-free)
- **Email**: info@comtelitalia.it
- **Website**: www.comtelitalia.it
- **Tagline**: "#WEconnect"
- **Mission**: "Uniamo persone, tecnologie e informazioni in un'unica infrastruttura dinamica e scalabile"
- **Key Services**: VoIP & Unified Communications, Network Security, Cloud & IT Transformation, Cybersecurity, Session Border Controller, Data Networking, Modern Work
- **Partners**: Microsoft, Huawei, HPE
- **Business Hours**: Monday-Friday 09:00-18:00 CET/CEST

## Language & Localization

- **Agent Language**: Italian (all prompts, responses, tool descriptions in Italian)
- **Technical Parameters**: Keep in English for API compatibility (e.g., tool names, parameter keys)
- **Console Logs**: Use Italian for user-facing messages, English acceptable for debug logs
- **Timezone**: CET/CEST (UTC+1/UTC+2)

## Environment Variables

Required in `.env`:
- `OPENAI_API_KEY`: OpenAI API key with Realtime API access
- `TWILIO_ACCOUNT_SID`: Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Twilio Auth Token
- `SERVER_URL`: Public URL without protocol (e.g., `comtel-voice-agent.onrender.com`)
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/comtel_voice`)
- `TRANSFER_NUMBER_MAIN`: Main transfer number (sales/general), e.g., `+390220527868`
- `TRANSFER_NUMBER_SUPPORT`: Technical support transfer number, e.g., `+39800200960`

## Database Schema (Prisma)

The app uses PostgreSQL with 4 main tables:

1. **calls**: Tracks all incoming calls (callSid, from/to numbers, status, duration)
2. **callbacks**: Callback requests with reference numbers (RIC-xxxxx format)
3. **messages**: Messages for employees with reference numbers (MSG-xxxxx format)
4. **transcripts**: Full conversation transcripts (speaker, agentName, text, sequenceNumber)

**Graceful degradation**: If database connection fails, the app continues working but falls back to console logging.

## Common Modification Scenarios

### Updating Agent Personality/Instructions
Edit `MATHIAS_INSTRUCTIONS` in `src/agent.ts`. Keep in Italian. The agent is a **unified receptionist and financial assistant** - no longer uses multi-agent handoffs.

### Changing Voice
In `src/agent.ts`, modify the `voice` parameter. Options: alloy, echo, shimmer, verse, coral, sage.

### Adding New General Tools
1. Define tool in `src/tools.ts` using `tool()` from `@openai/agents/realtime`
2. Use Zod schemas for parameter validation
3. Add to the tools array returned by `createComtelTools()`
4. Keep tool names in English, descriptions in Italian
5. Return JSON stringified results
6. Integrate database saves using services from `src/db/services/`

### Adding New Financial Tools
1. Define tool in `src/financial-tools.ts`
2. Update financial data in `src/data/financial-data.json`
3. Follow same pattern as existing tools (Zod validation, JSON return)
4. Keep in mind: Financial tools are only accessible after `verify_access_code` succeeds

### Modifying Company Information
Update return values in:
- `getCompanyInfo()` in `src/tools.ts`: Services, contact details, partners
- `getBusinessHours()` in `src/tools.ts`: Operating schedule
- `getLocation()` in `src/tools.ts`: Office address and directions
- `src/data/financial-data.json`: Financial data (revenues, balance sheet, etc.)

### Updating Transcription Configuration
Transcription is configured in `src/index.ts` during RealtimeSession creation:
```typescript
config: {
  inputAudioTranscription: {
    model: 'gpt-4o-transcribe',  // or 'gpt-4o-mini-transcribe'
    language: 'it'
  }
}
```
**Important**: Do NOT try to configure transcription via `sendMessage()` - it must be set during session initialization.

### Implementing Call Transfers
Call transfers require special handling due to WebSocket Media Streams:

**Architecture:** The transfer tool receives a `CallState` object containing:
- `callSid`: Twilio Call SID
- `callerNumber`: Incoming caller's phone number
- `twilioNumber`: Twilio/SIP number that received the call
- `session`: RealtimeSession reference (for closing)

**Transfer Process (3 steps):**
1. Close the OpenAI session: `await session.close()`
2. Wait for clean WebSocket closure: `await new Promise(resolve => setTimeout(resolve, 200))`
3. Update call with transfer TwiML: `await client.calls(callSid).update({ twiml: '<Response><Dial>...</Dial></Response>' })`

**Why this is necessary:** Calls in `<Connect><Stream>` are locked by Twilio and cannot be updated via REST API while the WebSocket is active. Closing the session first releases the call.

**Transfer numbers:** Use environment variables `TRANSFER_NUMBER_MAIN` and `TRANSFER_NUMBER_SUPPORT` in agent instructions for easy configuration.

## Testing

1. **Health Check**: `curl https://comtel-voice-agent.onrender.com/`
2. **Phone Test**: Call the Twilio number and interact with Mathias
3. **Monitor Logs**: Watch for:
   - `📞 Incoming call received`
   - `🔌 WebSocket connection established`
   - `✅ Connected to OpenAI Realtime API`
   - `📝 Transcript logging enabled (gpt-4o-transcribe, Italian)`
   - Tool execution logs (in Italian)
   - Database save confirmations
   - Transcript events: `conversation.item.input_audio_transcription.completed`

## Production Deployment

### Render.com Setup
1. **Build Command**: `npm install && npm run build && npx prisma migrate deploy`
2. **Start Command**: `npm start`
3. **Add PostgreSQL**: Link a PostgreSQL database (auto-sets `DATABASE_URL`)
4. **Environment Variables**: Set all required env vars from `.env.example`
5. **Twilio Webhook**: Point to `https://comtel-voice-agent.onrender.com/incoming-call`

### Important Notes
- **Message/Callback Storage**: Now saves to PostgreSQL database (not just console logs)
- **Transcripts**: Automatically saved to database for every call
- **Error Monitoring**: Errors are logged; consider adding Sentry
- **API Rate Limits**: Monitor OpenAI API usage (especially transcription costs)
- **Financial Data Security**: Move access codes to environment variables or secure database
