-- Consentimiento explícito para campañas de inversión dirigidas a usuarios PRO.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "investmentEmailNotifications" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "ProEmailCampaign" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProEmailCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProEmailCampaign_createdAt_idx" ON "ProEmailCampaign"("createdAt");
CREATE INDEX IF NOT EXISTS "ProEmailCampaign_createdById_createdAt_idx" ON "ProEmailCampaign"("createdById", "createdAt");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ProEmailCampaign_createdById_fkey'
  ) THEN
    ALTER TABLE "ProEmailCampaign"
      ADD CONSTRAINT "ProEmailCampaign_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
