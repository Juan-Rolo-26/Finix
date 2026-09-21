ALTER TABLE "ProEmailCampaign" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SENT';
ALTER TABLE "ProEmailCampaign" ADD COLUMN "previewText" TEXT;
ALTER TABLE "ProEmailCampaign" ADD COLUMN "contentHtml" TEXT;
ALTER TABLE "ProEmailCampaign" ADD COLUMN "contentText" TEXT;
ALTER TABLE "ProEmailCampaign" ADD COLUMN "audience" TEXT NOT NULL DEFAULT 'PRO';
ALTER TABLE "ProEmailCampaign" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "ProEmailCampaign" ADD COLUMN "sentAt" TIMESTAMP(3);
ALTER TABLE "ProEmailCampaign" ADD COLUMN "templateId" TEXT;

CREATE TABLE "EmailTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'MARKETING',
  "subject" TEXT NOT NULL,
  "previewText" TEXT,
  "contentHtml" TEXT NOT NULL,
  "contentText" TEXT,
  "variables" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailCampaignRecipient" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "providerId" TEXT,
  "error" TEXT,
  "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailCampaignRecipient_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "providerId" TEXT,
  "campaignId" TEXT,
  "recipientId" TEXT,
  "userId" TEXT,
  "linkUrl" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "marketing" BOOLEAN NOT NULL DEFAULT true,
  "alerts" BOOLEAN NOT NULL DEFAULT true,
  "analysis" BOOLEAN NOT NULL DEFAULT true,
  "calendar" BOOLEAN NOT NULL DEFAULT true,
  "earnings" BOOLEAN NOT NULL DEFAULT true,
  "daily" BOOLEAN NOT NULL DEFAULT true,
  "weekly" BOOLEAN NOT NULL DEFAULT true,
  "community" BOOLEAN NOT NULL DEFAULT true,
  "product" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailPreference_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailSegment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "definition" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailSegment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailMedia" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "altText" TEXT,
  "mimeType" TEXT,
  "size" INTEGER,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailMedia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailCampaignRecipient_campaignId_userId_key" ON "EmailCampaignRecipient"("campaignId", "userId");
CREATE UNIQUE INDEX "EmailEvent_type_providerId_recipientId_linkUrl_key" ON "EmailEvent"("type", "providerId", "recipientId", "linkUrl");
CREATE UNIQUE INDEX "EmailPreference_userId_key" ON "EmailPreference"("userId");
CREATE INDEX "EmailCampaignRecipient_campaignId_status_idx" ON "EmailCampaignRecipient"("campaignId", "status");
CREATE INDEX "EmailCampaignRecipient_userId_updatedAt_idx" ON "EmailCampaignRecipient"("userId", "updatedAt");
CREATE INDEX "EmailEvent_campaignId_type_createdAt_idx" ON "EmailEvent"("campaignId", "type", "createdAt");
CREATE INDEX "EmailEvent_userId_createdAt_idx" ON "EmailEvent"("userId", "createdAt");
CREATE INDEX "EmailTemplate_type_updatedAt_idx" ON "EmailTemplate"("type", "updatedAt");
CREATE INDEX "EmailSegment_createdById_updatedAt_idx" ON "EmailSegment"("createdById", "updatedAt");
CREATE INDEX "EmailMedia_createdAt_idx" ON "EmailMedia"("createdAt");

ALTER TABLE "ProEmailCampaign" ADD CONSTRAINT "ProEmailCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ProEmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ProEmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "EmailCampaignRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailPreference" ADD CONSTRAINT "EmailPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSegment" ADD CONSTRAINT "EmailSegment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailMedia" ADD CONSTRAINT "EmailMedia_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
