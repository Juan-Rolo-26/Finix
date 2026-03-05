/*
  Warnings:

  - You are about to drop the column `pinnedAssets` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "deletedAt" DATETIME;

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'post',
    "visibility" TEXT NOT NULL DEFAULT 'VISIBLE',
    "deletedAt" DATETIME,
    "assetSymbol" TEXT,
    "analysisType" TEXT,
    "riskLevel" TEXT,
    "contentEditedAt" DATETIME,
    "mediaUrl" TEXT,
    "tickers" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("analysisType", "assetSymbol", "authorId", "content", "contentEditedAt", "createdAt", "id", "mediaUrl", "riskLevel", "tickers", "type", "updatedAt") SELECT "analysisType", "assetSymbol", "authorId", "content", "contentEditedAt", "createdAt", "id", "mediaUrl", "riskLevel", "tickers", "type", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
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
INSERT INTO "new_User" ("acceptingFollowers", "accountType", "aiUsageLimit", "aiUsageThisMonth", "autoRefreshMarket", "avatarUrl", "bannerUrl", "bio", "bioLong", "certifications", "chartDensity", "compactTables", "company", "createdAt", "currency", "email", "id", "instagramUrl", "isCreator", "isInfluencer", "isProfilePublic", "isVerified", "language", "lastAiUsageReset", "linkedinUrl", "location", "marketNotifications", "onboardingCompleted", "onboardingStep", "password", "plan", "returnsVisibilityMode", "riskScore", "role", "showActivity", "showAdvancedMetrics", "showExactReturns", "showPortfolio", "showStats", "specializations", "stripeCustomerId", "subscriptionStatus", "theme", "timezone", "title", "totalReturn", "twitterUrl", "updatedAt", "username", "website", "winRate", "yearsExperience", "youtubeUrl") SELECT "acceptingFollowers", "accountType", "aiUsageLimit", "aiUsageThisMonth", "autoRefreshMarket", "avatarUrl", "bannerUrl", "bio", "bioLong", "certifications", "chartDensity", "compactTables", "company", "createdAt", "currency", "email", "id", "instagramUrl", "isCreator", "isInfluencer", "isProfilePublic", "isVerified", "language", "lastAiUsageReset", "linkedinUrl", "location", "marketNotifications", "onboardingCompleted", "onboardingStep", "password", "plan", "returnsVisibilityMode", "riskScore", "role", "showActivity", "showAdvancedMetrics", "showExactReturns", "showPortfolio", "showStats", "specializations", "stripeCustomerId", "subscriptionStatus", "theme", "timezone", "title", "totalReturn", "twitterUrl", "updatedAt", "username", "website", "winRate", "yearsExperience", "youtubeUrl" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");
