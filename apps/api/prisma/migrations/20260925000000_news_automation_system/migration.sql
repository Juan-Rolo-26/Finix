-- Configurable news automation, source mapping, deduplication and sync logs.

ALTER TABLE "NewsCategory"
  ADD COLUMN IF NOT EXISTS "updateFrequency" TEXT NOT NULL DEFAULT 'WEEKLY',
  ADD COLUMN IF NOT EXISTS "updateHour" INTEGER NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS "updateMinute" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updateDayOfWeek" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastUpdatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextUpdateAt" TIMESTAMP(3);

ALTER TABLE "NewsSource"
  ADD COLUMN IF NOT EXISTS "baseUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "apiUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "url" TEXT,
  ADD COLUMN IF NOT EXISTS "rssUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "reliabilityScore" INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "lastSuccessfulSync" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastError" TEXT;

ALTER TABLE "NewsArticle"
  ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "normalizedTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "eventFingerprint" TEXT,
  ADD COLUMN IF NOT EXISTS "relevanceScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sourceId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "NewsArticle_canonicalUrl_key"
  ON "NewsArticle"("canonicalUrl");
CREATE INDEX IF NOT EXISTS "NewsArticle_relevanceScore_publishedAt_idx"
  ON "NewsArticle"("relevanceScore", "publishedAt");
CREATE INDEX IF NOT EXISTS "NewsArticle_eventFingerprint_idx"
  ON "NewsArticle"("eventFingerprint");
CREATE INDEX IF NOT EXISTS "NewsArticle_sourceId_idx"
  ON "NewsArticle"("sourceId");

CREATE TABLE IF NOT EXISTS "NewsSourceCategory" (
  "sourceId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "reliabilityScore" INTEGER NOT NULL DEFAULT 50,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NewsSourceCategory_pkey" PRIMARY KEY ("sourceId", "categoryId"),
  CONSTRAINT "NewsSourceCategory_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NewsSourceCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NewsCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "NewsSourceCategory_categoryId_idx"
  ON "NewsSourceCategory"("categoryId");

ALTER TABLE "NewsSourceCategory"
  ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reliabilityScore" INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "NewsArticleSource" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "sourceId" TEXT,
  "sourceName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NewsArticleSource_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NewsArticleSource_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "NewsArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NewsArticleSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsArticleSource_articleId_url_key"
  ON "NewsArticleSource"("articleId", "url");
CREATE INDEX IF NOT EXISTS "NewsArticleSource_articleId_idx"
  ON "NewsArticleSource"("articleId");
CREATE INDEX IF NOT EXISTS "NewsArticleSource_sourceId_idx"
  ON "NewsArticleSource"("sourceId");

CREATE TABLE IF NOT EXISTS "NewsSyncLog" (
  "id" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "frequency" TEXT NOT NULL,
  "categoriesProcessed" TEXT NOT NULL DEFAULT '[]',
  "sourcesProcessed" TEXT NOT NULL DEFAULT '[]',
  "articlesFound" INTEGER NOT NULL DEFAULT 0,
  "articlesCreated" INTEGER NOT NULL DEFAULT 0,
  "articlesUpdated" INTEGER NOT NULL DEFAULT 0,
  "duplicatesDetected" INTEGER NOT NULL DEFAULT 0,
  "failedSources" TEXT NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "errorMessage" TEXT,
  CONSTRAINT "NewsSyncLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "NewsSyncLog_startedAt_idx"
  ON "NewsSyncLog"("startedAt");
CREATE INDEX IF NOT EXISTS "NewsSyncLog_frequency_status_idx"
  ON "NewsSyncLog"("frequency", "status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NewsArticle_sourceId_fkey') THEN
    ALTER TABLE "NewsArticle"
      ADD CONSTRAINT "NewsArticle_sourceId_fkey"
      FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
