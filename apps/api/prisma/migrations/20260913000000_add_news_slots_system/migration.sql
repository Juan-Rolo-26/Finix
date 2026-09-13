-- Migration: Add News CMS Slot System
-- Adds isActive, displayOrder, image, updatedAt to NewsCategory
-- Adds NewsArticle, NewsSlot, NewsSlotHistory models

-- Update NewsCategory
ALTER TABLE "NewsCategory" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "NewsCategory" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NewsCategory" ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "NewsCategory" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- NewsArticle: articles assigned manually to slots
CREATE TABLE IF NOT EXISTS "NewsArticle" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "author" TEXT,
    "customTitle" BOOLEAN NOT NULL DEFAULT false,
    "customDescription" BOOLEAN NOT NULL DEFAULT false,
    "customImage" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NewsArticle_url_key" ON "NewsArticle"("url");
CREATE INDEX IF NOT EXISTS "NewsArticle_categoryId_idx" ON "NewsArticle"("categoryId");
CREATE INDEX IF NOT EXISTS "NewsArticle_status_idx" ON "NewsArticle"("status");
CREATE INDEX IF NOT EXISTS "NewsArticle_isPublished_idx" ON "NewsArticle"("isPublished");

-- Foreign key for NewsArticle → NewsCategory
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'NewsArticle_categoryId_fkey'
  ) THEN
    ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "NewsCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- NewsSlot: fixed position in a category mosaic
CREATE TABLE IF NOT EXISTS "NewsSlot" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "articleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NewsSlot_slotKey_key" ON "NewsSlot"("slotKey");
CREATE UNIQUE INDEX IF NOT EXISTS "NewsSlot_categoryId_position_key" ON "NewsSlot"("categoryId", "position");
CREATE INDEX IF NOT EXISTS "NewsSlot_categoryId_idx" ON "NewsSlot"("categoryId");
CREATE INDEX IF NOT EXISTS "NewsSlot_articleId_idx" ON "NewsSlot"("articleId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'NewsSlot_categoryId_fkey'
  ) THEN
    ALTER TABLE "NewsSlot" ADD CONSTRAINT "NewsSlot_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "NewsCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'NewsSlot_articleId_fkey'
  ) THEN
    ALTER TABLE "NewsSlot" ADD CONSTRAINT "NewsSlot_articleId_fkey"
      FOREIGN KEY ("articleId") REFERENCES "NewsArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- NewsSlotHistory: change audit log for slots
CREATE TABLE IF NOT EXISTS "NewsSlotHistory" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "previousArticleId" TEXT,
    "newArticleId" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsSlotHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NewsSlotHistory_slotId_idx" ON "NewsSlotHistory"("slotId");
CREATE INDEX IF NOT EXISTS "NewsSlotHistory_changedAt_idx" ON "NewsSlotHistory"("changedAt");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'NewsSlotHistory_slotId_fkey'
  ) THEN
    ALTER TABLE "NewsSlotHistory" ADD CONSTRAINT "NewsSlotHistory_slotId_fkey"
      FOREIGN KEY ("slotId") REFERENCES "NewsSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'NewsSlotHistory_previousArticleId_fkey'
  ) THEN
    ALTER TABLE "NewsSlotHistory" ADD CONSTRAINT "NewsSlotHistory_previousArticleId_fkey"
      FOREIGN KEY ("previousArticleId") REFERENCES "NewsArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'NewsSlotHistory_newArticleId_fkey'
  ) THEN
    ALTER TABLE "NewsSlotHistory" ADD CONSTRAINT "NewsSlotHistory_newArticleId_fkey"
      FOREIGN KEY ("newArticleId") REFERENCES "NewsArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
