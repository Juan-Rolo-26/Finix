ALTER TABLE "SiteAnalyticsSession" ADD COLUMN "userId" TEXT;
CREATE INDEX "SiteAnalyticsSession_userId_startedAt_idx" ON "SiteAnalyticsSession"("userId", "startedAt");
ALTER TABLE "SiteAnalyticsSession" ADD CONSTRAINT "SiteAnalyticsSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialAdvisorVerification" ADD COLUMN "truthDeclarationAccepted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "revocationConsentAccepted" BOOLEAN NOT NULL DEFAULT false;
