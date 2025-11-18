-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "searchVolume" INTEGER,
    "difficulty" DOUBLE PRECISION,
    "intent" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_overviews" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hasAiOverview" BOOLEAN NOT NULL,
    "position" INTEGER,
    "contentLength" INTEGER,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_overviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_data" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keywordId" TEXT,
    "url" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "device" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traffic_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_queries" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "modelVersion" TEXT,
    "queryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_responses" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "hasBrandMention" BOOLEAN NOT NULL,
    "brandPosition" INTEGER,
    "citedUrls" JSONB,
    "competitors" JSONB,
    "sentiment" TEXT,
    "responseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visibility_scores" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "mentionRate" DOUBLE PRECISION NOT NULL,
    "avgPosition" DOUBLE PRECISION,
    "citationRate" DOUBLE PRECISION NOT NULL,
    "shareOfVoice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visibility_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "parameters" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_userId_service_key" ON "api_keys"("userId", "service");

-- CreateIndex
CREATE INDEX "keywords_projectId_idx" ON "keywords"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_projectId_keyword_key" ON "keywords"("projectId", "keyword");

-- CreateIndex
CREATE INDEX "ai_overviews_projectId_date_idx" ON "ai_overviews"("projectId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ai_overviews_keywordId_date_key" ON "ai_overviews"("keywordId", "date");

-- CreateIndex
CREATE INDEX "traffic_data_projectId_date_idx" ON "traffic_data"("projectId", "date");

-- CreateIndex
CREATE INDEX "traffic_data_keywordId_idx" ON "traffic_data"("keywordId");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_data_projectId_keywordId_url_date_device_country_key" ON "traffic_data"("projectId", "keywordId", "url", "date", "device", "country");

-- CreateIndex
CREATE INDEX "chatbot_queries_projectId_platform_idx" ON "chatbot_queries"("projectId", "platform");

-- CreateIndex
CREATE INDEX "chatbot_responses_queryId_idx" ON "chatbot_responses"("queryId");

-- CreateIndex
CREATE UNIQUE INDEX "visibility_scores_projectId_platform_date_key" ON "visibility_scores"("projectId", "platform", "date");

-- CreateIndex
CREATE INDEX "visibility_scores_projectId_date_idx" ON "visibility_scores"("projectId", "date");

-- CreateIndex
CREATE INDEX "analysis_jobs_projectId_status_idx" ON "analysis_jobs"("projectId", "status");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_overviews" ADD CONSTRAINT "ai_overviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_overviews" ADD CONSTRAINT "ai_overviews_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_data" ADD CONSTRAINT "traffic_data_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_data" ADD CONSTRAINT "traffic_data_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "keywords"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_queries" ADD CONSTRAINT "chatbot_queries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_responses" ADD CONSTRAINT "chatbot_responses_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "chatbot_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
