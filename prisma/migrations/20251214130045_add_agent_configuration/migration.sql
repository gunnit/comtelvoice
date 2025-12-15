-- CreateTable
CREATE TABLE "agent_configs" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL DEFAULT 'Arthur',
    "voice" TEXT NOT NULL DEFAULT 'verse',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "model" TEXT NOT NULL DEFAULT 'gpt-realtime',
    "turnDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "vadThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "silenceDurationMs" INTEGER NOT NULL DEFAULT 500,
    "prefixPaddingMs" INTEGER NOT NULL DEFAULT 300,
    "greetingMessage" TEXT NOT NULL DEFAULT 'Ciao',
    "greetingDelayMs" INTEGER NOT NULL DEFAULT 200,
    "primaryLanguage" TEXT NOT NULL DEFAULT 'it',
    "autoDetectLanguage" BOOLEAN NOT NULL DEFAULT true,
    "transcriptionModel" TEXT NOT NULL DEFAULT 'gpt-4o-transcribe',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_instructions" (
    "id" TEXT NOT NULL,
    "useTemplate" BOOLEAN NOT NULL DEFAULT true,
    "customInstructions" TEXT,
    "roleDescription" TEXT,
    "communicationStyle" TEXT,
    "languageInstructions" TEXT,
    "closingInstructions" TEXT,
    "additionalInstructions" TEXT,
    "agentConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_bases" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "companyTagline" TEXT,
    "companyDescription" TEXT,
    "companyMission" TEXT,
    "phoneMain" TEXT,
    "phoneSupport" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "region" TEXT,
    "country" TEXT DEFAULT 'Italia',
    "directions" TEXT,
    "businessHours" JSONB,
    "timezone" TEXT DEFAULT 'CET/CEST',
    "holidayNote" TEXT,
    "services" JSONB,
    "businessAreas" JSONB,
    "partners" JSONB,
    "faqs" JSONB,
    "transferNumberMain" TEXT,
    "transferNumberSupport" TEXT,
    "financialAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
    "financialAccessCodes" JSONB,
    "financialDataPath" TEXT,
    "agentConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_configs" (
    "id" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "parameters" JSONB,
    "descriptionOverride" TEXT,
    "agentConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_configs_userId_key" ON "agent_configs"("userId");

-- CreateIndex
CREATE INDEX "agent_configs_userId_idx" ON "agent_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_instructions_agentConfigId_key" ON "agent_instructions"("agentConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_bases_agentConfigId_key" ON "knowledge_bases"("agentConfigId");

-- CreateIndex
CREATE INDEX "tool_configs_agentConfigId_idx" ON "tool_configs"("agentConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "tool_configs_agentConfigId_toolName_key" ON "tool_configs"("agentConfigId", "toolName");

-- AddForeignKey
ALTER TABLE "agent_configs" ADD CONSTRAINT "agent_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_instructions" ADD CONSTRAINT "agent_instructions_agentConfigId_fkey" FOREIGN KEY ("agentConfigId") REFERENCES "agent_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_agentConfigId_fkey" FOREIGN KEY ("agentConfigId") REFERENCES "agent_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_configs" ADD CONSTRAINT "tool_configs_agentConfigId_fkey" FOREIGN KEY ("agentConfigId") REFERENCES "agent_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
