/*
  Warnings:

  - You are about to drop the column `amount` on the `FinixRevenue` table. All the data in the column will be lost.
  - You are about to drop the column `currentPeriodEnd` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `currentPeriodStart` on the `Subscription` table. All the data in the column will be lost.
  - Added the required column `commissionAmount` to the `FinixRevenue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorAmount` to the `FinixRevenue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommunityMember" ADD COLUMN "stripeSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeEventId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CommunityPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "commissionAmount" DECIMAL NOT NULL,
    "creatorAmount" DECIMAL NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
    "billingType" TEXT NOT NULL DEFAULT 'monthly',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityPayment_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommunityPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CommunityPayment" ("amount", "commissionAmount", "communityId", "createdAt", "creatorAmount", "id", "status", "stripePaymentId", "userId") SELECT "amount", "commissionAmount", "communityId", "createdAt", "creatorAmount", "id", "status", "stripePaymentId", "userId" FROM "CommunityPayment";
DROP TABLE "CommunityPayment";
ALTER TABLE "new_CommunityPayment" RENAME TO "CommunityPayment";
CREATE UNIQUE INDEX "CommunityPayment_stripePaymentId_key" ON "CommunityPayment"("stripePaymentId");
CREATE INDEX "CommunityPayment_communityId_createdAt_idx" ON "CommunityPayment"("communityId", "createdAt");
CREATE INDEX "CommunityPayment_userId_createdAt_idx" ON "CommunityPayment"("userId", "createdAt");
CREATE TABLE "new_CreatorBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "availableBalance" DECIMAL NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreatorBalance_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CreatorBalance" ("availableBalance", "creatorId", "id", "pendingBalance", "updatedAt") SELECT "availableBalance", "creatorId", "id", "pendingBalance", "updatedAt" FROM "CreatorBalance";
DROP TABLE "CreatorBalance";
ALTER TABLE "new_CreatorBalance" RENAME TO "CreatorBalance";
CREATE UNIQUE INDEX "CreatorBalance_creatorId_key" ON "CreatorBalance"("creatorId");
CREATE TABLE "new_FinixRevenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "paymentId" TEXT,
    "subscriptionId" TEXT,
    "totalAmount" DECIMAL NOT NULL,
    "commissionAmount" DECIMAL NOT NULL,
    "creatorAmount" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinixRevenue_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "CommunityPayment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinixRevenue_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinixRevenue" ("createdAt", "id", "paymentId", "subscriptionId", "totalAmount", "type") SELECT "createdAt", "id", "paymentId", "subscriptionId", "totalAmount", "type" FROM "FinixRevenue";
DROP TABLE "FinixRevenue";
ALTER TABLE "new_FinixRevenue" RENAME TO "FinixRevenue";
CREATE UNIQUE INDEX "FinixRevenue_paymentId_key" ON "FinixRevenue"("paymentId");
CREATE UNIQUE INDEX "FinixRevenue_subscriptionId_key" ON "FinixRevenue"("subscriptionId");
CREATE INDEX "FinixRevenue_type_createdAt_idx" ON "FinixRevenue"("type", "createdAt");
CREATE TABLE "new_Payout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorBalanceId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripePayoutId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    CONSTRAINT "Payout_creatorBalanceId_fkey" FOREIGN KEY ("creatorBalanceId") REFERENCES "CreatorBalance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payout" ("amount", "createdAt", "creatorBalanceId", "id", "status", "stripePayoutId") SELECT "amount", "createdAt", "creatorBalanceId", "id", "status", "stripePayoutId" FROM "Payout";
DROP TABLE "Payout";
ALTER TABLE "new_Payout" RENAME TO "Payout";
CREATE INDEX "Payout_status_createdAt_idx" ON "Payout"("status", "createdAt");
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "plan" TEXT NOT NULL DEFAULT 'PRO',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("createdAt", "id", "plan", "status", "stripeCustomerId", "stripeSubscriptionId", "updatedAt", "userId") SELECT "createdAt", "id", "plan", "status", "stripeCustomerId", "stripeSubscriptionId", "updatedAt", "userId" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("acceptingFollowers", "accountType", "avatarUrl", "bannerUrl", "bio", "bioLong", "certifications", "company", "createdAt", "email", "id", "instagramUrl", "isInfluencer", "isProfilePublic", "isVerified", "linkedinUrl", "location", "password", "plan", "riskScore", "role", "showPortfolio", "showStats", "specializations", "stripeCustomerId", "subscriptionStatus", "title", "totalReturn", "twitterUrl", "updatedAt", "username", "website", "winRate", "yearsExperience", "youtubeUrl") SELECT "acceptingFollowers", "accountType", "avatarUrl", "bannerUrl", "bio", "bioLong", "certifications", "company", "createdAt", "email", "id", "instagramUrl", "isInfluencer", "isProfilePublic", "isVerified", "linkedinUrl", "location", "password", "plan", "riskScore", "role", "showPortfolio", "showStats", "specializations", "stripeCustomerId", coalesce("subscriptionStatus", 'INACTIVE') AS "subscriptionStatus", "title", "totalReturn", "twitterUrl", "updatedAt", "username", "website", "winRate", "yearsExperience", "youtubeUrl" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentLog_stripeEventId_key" ON "PaymentLog"("stripeEventId");

-- CreateIndex
CREATE INDEX "PaymentLog_type_createdAt_idx" ON "PaymentLog"("type", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityMember_userId_subscriptionStatus_idx" ON "CommunityMember"("userId", "subscriptionStatus");
