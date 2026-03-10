-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "shadowbanned" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" DATETIME,
    "flags" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationCode" TEXT,
    "emailVerificationExpires" DATETIME,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" DATETIME,
    "adminTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adminTotpSecret" TEXT,
    "adminTotpTempSecret" TEXT,
    "adminTotpTempExpires" DATETIME,
    "adminLockedUntil" DATETIME,
    "adminFailedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "bioLong" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "isInfluencer" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "accountType" TEXT NOT NULL DEFAULT 'BASIC',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
    "aiUsageThisMonth" INTEGER NOT NULL DEFAULT 0,
    "aiUsageLimit" INTEGER NOT NULL DEFAULT 0,
    "lastAiUsageReset" DATETIME,
    "title" TEXT,
    "company" TEXT,
    "location" TEXT,
    "website" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "youtubeUrl" TEXT,
    "instagramUrl" TEXT,
    "yearsExperience" INTEGER,
    "specializations" TEXT,
    "certifications" TEXT,
    "totalReturn" REAL,
    "winRate" REAL,
    "riskScore" REAL,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT true,
    "showPortfolio" BOOLEAN NOT NULL DEFAULT false,
    "showStats" BOOLEAN NOT NULL DEFAULT false,
    "acceptingFollowers" BOOLEAN NOT NULL DEFAULT true,
    "showActivity" BOOLEAN NOT NULL DEFAULT true,
    "showExactReturns" BOOLEAN NOT NULL DEFAULT true,
    "returnsVisibilityMode" TEXT NOT NULL DEFAULT 'exact',
    "language" TEXT NOT NULL DEFAULT 'es-AR',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "autoRefreshMarket" BOOLEAN NOT NULL DEFAULT true,
    "compactTables" BOOLEAN NOT NULL DEFAULT false,
    "showAdvancedMetrics" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "chartDensity" TEXT NOT NULL DEFAULT 'normal',
    "marketNotifications" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Cordoba',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("acceptingFollowers", "accountType", "aiUsageLimit", "aiUsageThisMonth", "autoRefreshMarket", "avatarUrl", "bannerUrl", "bio", "bioLong", "certifications", "chartDensity", "compactTables", "company", "createdAt", "currency", "email", "emailVerificationCode", "emailVerificationExpires", "emailVerified", "flags", "id", "instagramUrl", "isCreator", "isInfluencer", "isProfilePublic", "isVerified", "language", "lastAiUsageReset", "lastLogin", "linkedinUrl", "location", "marketNotifications", "onboardingCompleted", "onboardingStep", "password", "plan", "resetPasswordExpires", "resetPasswordToken", "returnsVisibilityMode", "riskScore", "role", "shadowbanned", "showActivity", "showAdvancedMetrics", "showExactReturns", "showPortfolio", "showStats", "specializations", "status", "stripeCustomerId", "subscriptionStatus", "theme", "timezone", "title", "totalReturn", "twitterUrl", "updatedAt", "username", "website", "winRate", "yearsExperience", "youtubeUrl") SELECT "acceptingFollowers", "accountType", "aiUsageLimit", "aiUsageThisMonth", "autoRefreshMarket", "avatarUrl", "bannerUrl", "bio", "bioLong", "certifications", "chartDensity", "compactTables", "company", "createdAt", "currency", "email", "emailVerificationCode", "emailVerificationExpires", "emailVerified", "flags", "id", "instagramUrl", "isCreator", "isInfluencer", "isProfilePublic", "isVerified", "language", "lastAiUsageReset", "lastLogin", "linkedinUrl", "location", "marketNotifications", "onboardingCompleted", "onboardingStep", "password", "plan", "resetPasswordExpires", "resetPasswordToken", "returnsVisibilityMode", "riskScore", "role", "shadowbanned", "showActivity", "showAdvancedMetrics", "showExactReturns", "showPortfolio", "showStats", "specializations", "status", "stripeCustomerId", "subscriptionStatus", "theme", "timezone", "title", "totalReturn", "twitterUrl", "updatedAt", "username", "website", "winRate", "yearsExperience", "youtubeUrl" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AdminSession_userId_expiresAt_idx" ON "AdminSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "AdminSession_revokedAt_idx" ON "AdminSession"("revokedAt");
