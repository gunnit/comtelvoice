# Comtel Voice Agent - Arthur

A production-ready Twilio voice agent powered by OpenAI's Realtime API. Arthur acts as a professional secretary and receptionist for Comtel, handling incoming calls, providing company information, and demonstrating excellent phone etiquette.

## Features

- **Natural Voice Conversations**: Real-time speech-to-speech interaction using OpenAI's GPT-4 Realtime API
- **Professional Phone Handling**: Greets callers, answers questions, takes messages, and schedules callbacks
- **Twilio Integration**: Seamless integration with Twilio voice calls via WebSocket
- **Smart Tools**: Access to company information, business hours, location details, and more
- **Production Ready**: Comprehensive error handling, logging, and graceful shutdown

## Agent Capabilities

Arthur can:
- Greet callers warmly and professionally
- Provide information about Comtel's services and contact details
- Share business hours and operating schedule
- Give office location and directions
- Take detailed messages for employees or departments
- Schedule callback requests with confirmation numbers
- Handle urgent matters with appropriate priority

## Project Structure

```
/comtel-voice-agent
  /src
    index.ts          # Main server with Fastify and WebSocket handling
    agent.ts          # Arthur agent configuration and instructions
    tools.ts          # Tool definitions for company operations
  .env                # Environment variables (not committed)
  .env.example        # Template for environment variables
  package.json        # Dependencies and scripts
  tsconfig.json       # TypeScript configuration
  README.md           # This file
```

## Prerequisites

- Node.js 18+ (with npm)
- Twilio account with a phone number
- OpenAI API key with access to GPT-4 Realtime API
- ngrok or similar tunneling tool (for local development)

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd comtel-voice-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your actual values:
   ```env
   OPENAI_API_KEY=sk-proj-your-key-here
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   SERVER_URL=your-domain.ngrok-free.app
   PORT=3000
   ```

## Development Setup

### Option 1: Local Development with ngrok

1. **Start ngrok** (in a separate terminal):
   ```bash
   ngrok http 3000
   ```

   Copy the ngrok URL (e.g., `abc123.ngrok-free.app`) and update `SERVER_URL` in `.env`

2. **Start the development server**:
   ```bash
   npm run dev
   ```

   The server will start with hot-reload enabled using `tsx watch`

3. **Configure Twilio webhook**:
   - Go to your Twilio Console
   - Navigate to Phone Numbers > Manage > Active numbers
   - Select your phone number
   - Under "Voice & Fax", set "A CALL COMES IN" to:
     ```
     https://your-ngrok-url.ngrok-free.app/incoming-call
     ```
   - Save the configuration

### Option 2: Deploy to Render.com

1. **Push code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Comtel voice agent"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Create new Web Service on Render**:
   - Connect your GitHub repository
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Add environment variables from `.env`
   - The `SERVER_URL` should be your Render URL (e.g., `comtel-voice-agent.onrender.com`)

3. **Configure Twilio webhook**:
   ```
   https://comtel-voice-agent.onrender.com/incoming-call
   ```

## Available Scripts

```bash
# Development with hot-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Production start (requires build first)
npm start
```

## Testing the Voice Agent

1. **Verify server is running**:
   ```bash
   curl https://your-server-url/
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "Comtel Voice Agent",
     "agent": "Arthur",
     "timestamp": "2024-01-15T10:30:00.000Z"
   }
   ```

2. **Make a test call**:
   - Call your Twilio phone number
   - Wait for Arthur to answer
   - Test various interactions:
     - "What services does Comtel offer?"
     - "What are your business hours?"
     - "Where are you located?"
     - "I'd like to schedule a callback"
     - "I need to leave a message for [name]"

3. **Monitor logs**:

   Watch the server logs for real-time debugging:
   ```bash
   # In development mode, logs appear automatically
   npm run dev
   ```

   Key log events to watch for:
   - `📞 Incoming call received`
   - `🔌 WebSocket connection established`
   - `✅ Connected to OpenAI Realtime API`
   - `🔧 Tool called: [tool_name]`
   - `✓ Tool result: [result]`

## Architecture

### Components

1. **Fastify Server** (`src/index.ts`):
   - HTTP endpoint for health checks
   - Twilio webhook handler (returns TwiML)
   - WebSocket endpoint for media streaming

2. **Arthur Agent** (`src/agent.ts`):
   - Agent personality and instructions
   - Voice configuration (using "verse" voice)
   - Turn detection settings for natural conversation

3. **Tools** (`src/tools.ts`):
   - `get_company_info`: Company details and services
   - `get_business_hours`: Operating schedule
   - `get_location`: Office address and directions
   - `schedule_callback`: Records callback requests
   - `take_message`: Records messages for employees

### Flow Diagram

```
Caller → Twilio Phone Number
         ↓
     POST /incoming-call (TwiML response)
         ↓
     WebSocket /media-stream
         ↓
     TwilioRealtimeTransportLayer
         ↓
     OpenAI Realtime API (GPT-4)
         ↓
     Arthur Agent (with tools)
         ↓
     Audio Response → Caller
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key with Realtime API access | `sk-proj-...` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `ACxxxx...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `abc123...` |
| `SERVER_URL` | Public URL for webhooks (without https://) | `example.ngrok-free.app` |
| `PORT` | Server port number | `3000` |

## Troubleshooting

### "WebSocket connection failed"
- Ensure your ngrok tunnel is running
- Verify `SERVER_URL` in `.env` matches your ngrok URL
- Check that Twilio webhook URL is correct

### "Missing required environment variable"
- Double-check all variables in `.env`
- Ensure no typos in variable names
- Restart server after changing `.env`

### "Failed to connect to OpenAI"
- Verify your OpenAI API key is valid
- Ensure you have access to GPT-4 Realtime API
- Check OpenAI API status page for outages

### "No audio on call"
- Check Twilio media stream is connected (look for "Media stream started" log)
- Verify WebSocket connection is established
- Ensure OpenAI connection is successful

### Enable Debug Logging
```bash
# Add to .env
DEBUG=openai-agents*

# Restart server
npm run dev
```

## Customization

### Change Agent Voice
Edit `src/agent.ts`, line with `voice:` property:
```typescript
voice: 'verse', // Options: alloy, echo, shimmer, verse, coral, sage
```

### Modify Agent Instructions
Edit `ARTHUR_INSTRUCTIONS` in `src/agent.ts` to customize:
- Greeting style
- Response tone
- Behavior guidelines

### Add New Tools
1. Create tool definition in `src/tools.ts`:
   ```typescript
   export const yourNewTool = {
     name: 'your_tool_name',
     description: 'What the tool does',
     parameters: z.object({ /* your schema */ }),
     execute: async (params) => { /* your logic */ }
   };
   ```

2. Add to `comtelTools` array:
   ```typescript
   export const comtelTools = [
     // ... existing tools
     yourNewTool
   ];
   ```

### Update Company Information
Edit the return values in tool functions in `src/tools.ts`:
- `getCompanyInfo()`: Services, contact details
- `getBusinessHours()`: Operating hours
- `getLocation()`: Office address

## Production Considerations

- **API Rate Limits**: Monitor OpenAI API usage and set appropriate limits
- **Error Handling**: All errors are logged; consider adding external monitoring
- **Message Storage**: Currently logs to console; integrate with database/CRM for production
- **Security**: Keep `.env` file secure and never commit it to version control
- **Scaling**: Consider load balancing if handling high call volumes
- **Monitoring**: Set up health check monitoring for the `/` endpoint

## Technologies Used

- **Node.js & TypeScript**: Runtime and type safety
- **Fastify**: Fast web framework for HTTP/WebSocket
- **OpenAI Agents SDK**: Interface to GPT-4 Realtime API
- **Twilio**: Voice call infrastructure
- **Zod**: Schema validation for tool parameters
- **dotenv**: Environment variable management

## License

ISC

## Support

For issues or questions:
- Check the troubleshooting section above
- Review server logs for error messages
- Consult OpenAI Agents documentation: https://openai.github.io/openai-agents-js/
- Consult Twilio documentation: https://www.twilio.com/docs

---

**Built with care for Comtel** | Agent: Arthur | Version 1.0.0
