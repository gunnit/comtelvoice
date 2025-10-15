-- CreateTable
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "agentName" TEXT,
    "text" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION,
    "duration" DOUBLE PRECISION,
    "eventType" TEXT,
    "callId" TEXT NOT NULL,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transcripts_callId_sequenceNumber_idx" ON "transcripts"("callId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "transcripts_speaker_idx" ON "transcripts"("speaker");

-- CreateIndex
CREATE INDEX "transcripts_timestamp_idx" ON "transcripts"("timestamp");

-- AddForeignKey
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
