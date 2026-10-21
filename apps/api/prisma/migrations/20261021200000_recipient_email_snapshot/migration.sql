-- Preserve each recipient payload across uncertain Resend retries.
ALTER TABLE "EmailCampaignRecipient" ADD COLUMN "renderedContent" JSONB;
