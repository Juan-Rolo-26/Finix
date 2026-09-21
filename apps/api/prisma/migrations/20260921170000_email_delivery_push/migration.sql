ALTER TABLE "ProEmailCampaign" ADD COLUMN "sourceKey" TEXT, ADD COLUMN "audienceCursor" TEXT, ADD COLUMN "audienceReady" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "ProEmailCampaign_sourceKey_key" ON "ProEmailCampaign"("sourceKey");
ALTER TABLE "EmailCampaignRecipient" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN "lockedUntil" TIMESTAMP(3);
ALTER TABLE "EmailCampaignRecipient" ADD COLUMN "firstAttemptAt" TIMESTAMP(3);
ALTER TABLE "AssetAnalysis" ADD COLUMN "emailAnnounced" BOOLEAN NOT NULL DEFAULT false;
UPDATE "AssetAnalysis" SET "emailAnnounced" = true WHERE "status" = 'PUBLISHED';
UPDATE "ProEmailCampaign" SET "audienceReady" = true;
CREATE INDEX "ProEmailCampaign_status_scheduledAt_idx" ON "ProEmailCampaign"("status", "scheduledAt");
CREATE INDEX "EmailCampaignRecipient_status_nextAttemptAt_idx" ON "EmailCampaignRecipient"("status", "nextAttemptAt");
CREATE TABLE "PushSubscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "endpoint" TEXT NOT NULL UNIQUE,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "cursorAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cursorId" TEXT NOT NULL DEFAULT '',
  "failures" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lease" TEXT
);
CREATE INDEX "PushSubscription_nextAttemptAt_failures_idx" ON "PushSubscription"("nextAttemptAt", "failures");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
