# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Twilio voice agent for **Comtel Italia** (an Italian ICT systems integration company) powered by OpenAI's Realtime API. The agent "Mathias" acts as an Italian-speaking receptionist handling incoming calls, providing company information, taking messages, and scheduling callbacks.

**Critical Context**: All agent responses and prompts are in **Italian**. The company is based in Milan, Italy, not in the US.

## Development Commands

```bash
# Development with hot-reload (preferred for local testing)
npm run dev

# Build TypeScript to dist/
npm run build

# Production start (requires build first)
npm start
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

1. **src/index.ts**: Fastify server with three key responsibilities:
   - Health check endpoint: `GET /`
   - Twilio webhook handler: `POST /incoming-call` (returns TwiML with WebSocket URL)
   - WebSocket media stream: `/media-stream` (handles real-time audio with OpenAI)

2. **src/agent.ts**: Agent configuration
   - Contains `MATHIAS_INSTRUCTIONS` (in Italian) - the system prompt
   - Configures voice: "verse"
   - Model: `gpt-realtime` (NOT `gpt-4o-realtime-preview`)
   - Turn detection: Server VAD with 0.5 threshold, 500ms silence duration

3. **src/tools.ts**: Five function tools available to the agent:
   - `get_company_info`: Real Comtel Italia details (services, contact info, partners)
   - `get_business_hours`: Italian business hours (CET/CEST timezone)
   - `get_location`: Milan office address (Via Vittor Pisani, 10, Milano)
   - `schedule_callback`: Records callback requests (logs to console, would integrate with CRM in production)
   - `take_message`: Takes messages for employees (logs to console)

### Important Technical Details

- **Module System**: ESM (type: "module" in package.json)
- **Import Extensions**: Always use `.js` extension in imports (e.g., `./tools.js`) even though source is `.ts` - this is required for ESM
- **Audio Format**: g711_ulaw (automatically configured by TwilioRealtimeTransportLayer)
- **Error Handling**: Both transport and session have error handlers to prevent crashes. Response cancellation errors are expected and suppressed.

### OpenAI Agents API Reference

- **Official Documentation**: https://openai.github.io/openai-agents-js/openai/agents/readme/#classes
- Always reference this URL for the latest API methods, classes, and interfaces
- Key classes: RealtimeSession, RealtimeAgent, TwilioRealtimeTransportLayer
- Important: Use `sendMessage()` not `sendUserMessage()` for sending messages to the session

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

## Common Modification Scenarios

### Updating Agent Personality/Instructions
Edit `MATHIAS_INSTRUCTIONS` in `src/agent.ts`. Keep in Italian. Include context about Comtel Italia's services and values.

### Changing Voice
In `src/agent.ts`, modify the `voice` parameter. Options: alloy, echo, shimmer, verse, coral, sage.

### Adding New Tools
1. Define tool in `src/tools.ts` using `tool()` from `@openai/agents/realtime`
2. Use Zod schemas for parameter validation
3. Add to `comtelTools` array export
4. Keep tool names in English, descriptions in Italian
5. Return JSON stringified results

### Modifying Company Information
Update return values in:
- `getCompanyInfo()`: Services, contact details, partners
- `getBusinessHours()`: Operating schedule
- `getLocation()`: Office address and directions

## Testing

1. **Health Check**: `curl https://comtel-voice-agent.onrender.com/`
2. **Phone Test**: Call the Twilio number and interact with Mathias
3. **Monitor Logs**: Watch for:
   - `📞 Incoming call received`
   - `🔌 WebSocket connection established`
   - `✅ Connected to OpenAI Realtime API`
   - Tool execution logs (in Italian)

## Production Notes

- **Message Storage**: Currently logs to console. For production, integrate with database/CRM system in tool `execute()` functions
- **Error Monitoring**: Errors are logged; consider adding Sentry or similar
- **API Rate Limits**: Monitor OpenAI API usage
- **Twilio Webhook**: Must point to `https://comtel-voice-agent.onrender.com/incoming-call`
