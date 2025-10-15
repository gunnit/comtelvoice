-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "callSid" TEXT NOT NULL,
    "streamSid" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "callbacks" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "callerName" TEXT NOT NULL,
    "callerPhone" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "callId" TEXT,

    CONSTRAINT "callbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "callerName" TEXT NOT NULL,
    "callerPhone" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "forwardedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "forwardedAt" TIMESTAMP(3),
    "callId" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoffs" (
    "id" TEXT NOT NULL,
    "fromAgent" TEXT NOT NULL,
    "toAgent" TEXT NOT NULL,
    "reason" TEXT,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callId" TEXT,

    CONSTRAINT "handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calls_callSid_key" ON "calls"("callSid");

-- CreateIndex
CREATE INDEX "calls_callSid_idx" ON "calls"("callSid");

-- CreateIndex
CREATE INDEX "calls_startedAt_idx" ON "calls"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "callbacks_referenceNumber_key" ON "callbacks"("referenceNumber");

-- CreateIndex
CREATE INDEX "callbacks_status_idx" ON "callbacks"("status");

-- CreateIndex
CREATE INDEX "callbacks_createdAt_idx" ON "callbacks"("createdAt");

-- CreateIndex
CREATE INDEX "callbacks_referenceNumber_idx" ON "callbacks"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "messages_referenceNumber_key" ON "messages"("referenceNumber");

-- CreateIndex
CREATE INDEX "messages_status_idx" ON "messages"("status");

-- CreateIndex
CREATE INDEX "messages_recipientName_idx" ON "messages"("recipientName");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "messages_referenceNumber_idx" ON "messages"("referenceNumber");

-- CreateIndex
CREATE INDEX "handoffs_fromAgent_toAgent_idx" ON "handoffs"("fromAgent", "toAgent");

-- CreateIndex
CREATE INDEX "handoffs_createdAt_idx" ON "handoffs"("createdAt");

-- AddForeignKey
ALTER TABLE "callbacks" ADD CONSTRAINT "callbacks_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
