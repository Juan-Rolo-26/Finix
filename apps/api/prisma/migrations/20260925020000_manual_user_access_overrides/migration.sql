-- Admins can explicitly grant or revoke PRO access while preserving the
-- billing/subscription record. NULL keeps the automatic billing behavior.
ALTER TABLE "User"
ADD COLUMN "proAccessOverride" BOOLEAN;

-- Email verification is not the public Finix verification badge. Preserve
-- advisor approvals, but remove the old automatic badge from ordinary users.
UPDATE "User"
SET "isVerified" = FALSE
WHERE "financialAdvisorVerified" = FALSE;
