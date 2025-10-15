# Database Setup Guide

## ✅ Implementation Complete

Your Comtel Voice Agent now has full PostgreSQL database integration!

## Architecture

```
src/
├── db/
│   ├── index.ts              # Prisma client singleton
│   └── services/
│       ├── calls.ts          # Call tracking service
│       ├── callbacks.ts      # Callback requests service
│       ├── messages.ts       # Messages service
│       └── transcripts.ts    # Transcript service
├── tools.ts                  # Updated to save to database
└── index.ts                  # Tracks calls and transcripts
```

## Database Tables

### 1. **calls** - All incoming call records
- `id`, `callSid`, `streamSid`
- `from`, `to`, `status`
- `startedAt`, `endedAt`, `duration`

### 2. **callbacks** - Callback requests
- `id`, `referenceNumber` (RIC-xxxxx)
- `callerName`, `callerPhone`, `preferredTime`, `reason`
- `status`, `priority`, `assignedTo`
- `createdAt`, `scheduledFor`, `completedAt`

### 3. **messages** - Messages for employees
- `id`, `referenceNumber` (MSG-xxxxx)
- `recipientName`, `callerName`, `callerPhone`, `content`
- `urgent`, `status`, `priority`
- `createdAt`, `readAt`, `forwardedAt`

### 4. **transcripts** - Full conversation history
- `id`, `speaker`, `agentName`, `text`
- `sequenceNumber`, `timestamp`, `eventType`
- `confidence`, `duration`

## Daily Workflow

### Start Development:
```bash
# 1. Start PostgreSQL (if not running)
docker compose up -d

# 2. Run your app (as usual)
npm run dev
```

### View Database:
```bash
# Open Prisma Studio (visual database browser)
npx prisma studio
```
This opens http://localhost:5555 with a beautiful UI to browse your data.

### Stop Everything:
```bash
# Stop your app: Ctrl+C

# Stop PostgreSQL (optional)
docker compose down
```

## What Gets Saved Automatically

✅ **Every phone call** → saved to `calls` table
✅ **Callback requests** via `schedule_callback` tool → saved to `callbacks` table
✅ **Messages** via `take_message` tool → saved to `messages` table
✅ **Call transcripts** → saved to `transcripts` table (user & agent speech)

## Graceful Degradation

If the database is down, the app **still works**! It falls back to console logging.

## Production Deployment (Render)

### Step 1: Add PostgreSQL Add-on
1. Go to your Render service: https://dashboard.render.com/web/srv-d2u2ih15pdvs73a2dge0
2. Click **"New PostgreSQL"** to add a PostgreSQL database
3. Link it to your service (Render auto-sets `DATABASE_URL`)

### Step 2: Update Build Command
Update your Render build command to:
```bash
npm install && npm run build && npx prisma migrate deploy
```

### Step 3: Deploy
```bash
git add .
git commit -m "Add PostgreSQL database integration"
git push origin main
```

Render will auto-deploy and run migrations!

## Useful Commands

```bash
# View database tables
docker exec comtel-postgres psql -U comtel -d comtel_voice -c "\dt"

# View callbacks
docker exec comtel-postgres psql -U comtel -d comtel_voice -c "SELECT * FROM callbacks;"

# View messages
docker exec comtel-postgres psql -U comtel -d comtel_voice -c "SELECT * FROM messages;"

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d
npx prisma migrate dev

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration after schema changes
npx prisma migrate dev --name your_migration_name
```

## Environment Variables

**Local (.env):**
```bash
DATABASE_URL=postgresql://comtel:dev_password@localhost:5432/comtel_voice
```

**Production (Render):**
Automatically set by Render PostgreSQL add-on.

## Database Schema Changes

If you need to modify the schema:

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_change`
3. Commit the new migration to git

## Prisma Studio

The visual database browser is your best friend:

```bash
npx prisma studio
```

Opens at http://localhost:5555

- View all tables
- Edit data directly
- Filter, sort, search
- No SQL knowledge needed!

## What's Next?

Your database is production-ready! All data is being saved automatically.

**Optional enhancements:**
- Add email notifications for urgent messages
- Build an admin dashboard to view callbacks/messages
- Add SMS notifications via Twilio
- Export reports (CSV/Excel)
- Add authentication for Prisma Studio in production

---

**Questions?** Check the Prisma docs: https://www.prisma.io/docs
