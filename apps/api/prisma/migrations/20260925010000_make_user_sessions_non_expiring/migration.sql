-- Active Finix sessions are revoked explicitly, not by browser closure or age.
ALTER TABLE "UserSession"
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- Preserve every active session created by the previous one-year policy.
UPDATE "UserSession"
SET "expiresAt" = NULL
WHERE "revokedAt" IS NULL;
