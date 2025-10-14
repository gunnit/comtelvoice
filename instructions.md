Create a production-ready Twilio voice agent named "Mathias" that acts as a secretary/receptionist for Comtel. The agent should handle incoming calls, provide company information, and demonstrate professional phone etiquette.
Technical Requirements
1. Setup & Dependencies

Initialize a new Node.js/TypeScript project
Install required dependencies:

@openai/agents and @openai/agents-extensions
fastify, @fastify/formbody, @fastify/websocket
dotenv, ws, zod, tsx


Create proper TypeScript configuration

2. Reference Documentation
Scrape and review these OpenAI Agents documentation pages:

https://openai.github.io/openai-agents-js/guides/voice-agents
https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/
https://openai.github.io/openai-agents-js/guides/voice-agents/build/
https://openai.github.io/openai-agents-js/guides/voice-agents/transport/
https://openai.github.io/openai-agents-js/extensions/twilio/
https://openai.github.io/openai-agents-js/openai/agents/classes/agent/
https://openai.github.io/openai-agents-js/guides/tools/
https://openai.github.io/openai-agents-js/guides/config/

3. Environment Configuration
Create a .env file with:
OPENAI_API_KEY=your_openai_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
SERVER_URL=your_server_url_here
PORT=3000
4. Agent Configuration
Agent Name: Mathias
Agent Role: Secretary/Receptionist for Comtel
Core Instructions:
You are Mathias, a professional and friendly secretary at Comtel's reception desk. Your responsibilities include:

1. Greeting callers warmly and professionally
2. Answering questions about Comtel's services, location, and business hours
3. Taking messages for employees
4. Scheduling callbacks or appointments
5. Providing general company information
6. Transferring calls to appropriate departments when needed

Always be polite, patient, and helpful. Speak clearly and maintain a professional yet approachable tone.
5. Implementation Structure
Base the implementation on this reference code pattern:

Fastify server with WebSocket support
Twilio transport layer integration
OpenAI Realtime API connection
Proper session management and event handling
Tool integration (if needed for Comtel-specific functions)

Key Routes:

GET / - Health check endpoint
POST /incoming-call - Twilio webhook handler (returns TwiML)
WebSocket /media-stream - Realtime audio stream handler

6. Required Tools/Functions
Create tools for:

get_company_info - Returns basic Comtel information
get_business_hours - Returns operating hours
get_location - Returns office address
schedule_callback - Records callback request details
take_message - Records message for employees

7. Voice Configuration

Model: gpt-realtime
Voice: verse (or suggest alternatives: alloy, echo, shimmer)
Ensure clear audio output settings

8. Project Structure
/twilio-voice-agent
  /src
    index.ts          # Main server file
    agent.ts          # Agent configuration
    tools.ts          # Tool definitions
  .env                # Environment variables
  package.json        # Dependencies
  tsconfig.json       # TypeScript config
  README.md           # Setup instructions
9. Error Handling & Logging

Implement proper error handling for WebSocket connections
Log all tool calls and session events
Handle disconnections gracefully
Add console logs for debugging

10. Testing & Deployment Notes
Include in README:

How to start the server locally
How to expose via ngrok for Twilio webhook
How to configure Twilio phone number webhook URL
Testing instructions with sample phone call

Deliverables

Complete working codebase
README with setup instructions
.env.example template
package.json with all scripts
Comments explaining key sections

Success Criteria

Server starts without errors
Twilio successfully connects to WebSocket
Agent responds to voice input naturally
Tools execute correctly when called
Professional conversation flow maintained
Graceful error handling

Additional Notes

Follow TypeScript best practices
Use modern ES6+ syntax
Ensure code is production-ready
Add appropriate type definitions
Include graceful shutdown handlers (SIGINT)

Please build this complete project, ensuring all files are properly structured and the agent works end-to-end.