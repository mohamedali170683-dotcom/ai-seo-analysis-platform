-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandOrKeyword" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "competitors" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveredQuestion" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "searchVolume" INTEGER,
    "difficulty" DOUBLE PRECISION,
    "commercialIntent" TEXT,
    "category" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveredQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITestResult" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "modelVersion" TEXT,
    "queryNumber" INTEGER NOT NULL,
    "brandMentioned" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "contextExtract" TEXT,
    "sentiment" TEXT,
    "recommendationType" TEXT,
    "citedUrls" JSONB,
    "fullResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AITestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedCompetitor" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "domain" TEXT,
    "detectionMethod" TEXT NOT NULL,
    "mentionRate" DOUBLE PRECISION,
    "avgPosition" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectedCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "dataEvidence" TEXT NOT NULL,
    "aiReasoning" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "expectedImpact" JSONB,
    "effort" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "correlationScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_userId_status_idx" ON "Analysis"("userId", "status");

-- CreateIndex
CREATE INDEX "DiscoveredQuestion_analysisId_idx" ON "DiscoveredQuestion"("analysisId");

-- CreateIndex
CREATE INDEX "AITestResult_analysisId_platform_idx" ON "AITestResult"("analysisId", "platform");

-- CreateIndex
CREATE INDEX "AITestResult_questionId_idx" ON "AITestResult"("questionId");

-- CreateIndex
CREATE INDEX "DetectedCompetitor_analysisId_idx" ON "DetectedCompetitor"("analysisId");

-- CreateIndex
CREATE INDEX "AIInsight_analysisId_priority_idx" ON "AIInsight"("analysisId", "priority");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredQuestion" ADD CONSTRAINT "DiscoveredQuestion_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITestResult" ADD CONSTRAINT "AITestResult_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITestResult" ADD CONSTRAINT "AITestResult_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DiscoveredQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedCompetitor" ADD CONSTRAINT "DetectedCompetitor_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
