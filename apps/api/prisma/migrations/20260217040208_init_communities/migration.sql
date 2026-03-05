/*
  Warnings:

  - You are about to drop the `CreatorPayout` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to alter the column `price` on the `Community` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to drop the column `paymentStatus` on the `CommunityMember` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `CommunityMember` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentId` on the `CommunityMember` table. All the data in the column will be lost.
  - You are about to drop the column `commissionRate` on the `FinixRevenue` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `FinixRevenue` table. All the data in the column will be lost.
  - You are about to drop the column `sourceType` on the `FinixRevenue` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `FinixRevenue` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `User` table. All the data in the column will be lost.
  - Added the required column `category` to the `Community` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Community` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `paymentId` to the `FinixRevenue` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Subscription_stripeSubscriptionId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CreatorPayout";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Subscription";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommunityPost_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "commissionAmount" DECIMAL NOT NULL,
    "creatorAmount" DECIMAL NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityPayment_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommunityPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Community" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "bannerUrl" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL NOT NULL DEFAULT 0,
    "billingType" TEXT NOT NULL DEFAULT 'monthly',
    "maxMembers" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Community_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Community" ("billingType", "createdAt", "creatorId", "description", "id", "isPaid", "maxMembers", "name", "price", "updatedAt") SELECT "billingType", "createdAt", "creatorId", "description", "id", "isPaid", "maxMembers", "name", "price", "updatedAt" FROM "Community";
DROP TABLE "Community";
ALTER TABLE "new_Community" RENAME TO "Community";
CREATE TABLE "new_CommunityMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CommunityMember" ("communityId", "id", "joinedAt", "userId") SELECT "communityId", "id", "joinedAt", "userId" FROM "CommunityMember";
DROP TABLE "CommunityMember";
ALTER TABLE "new_CommunityMember" RENAME TO "CommunityMember";
CREATE UNIQUE INDEX "CommunityMember_communityId_userId_key" ON "CommunityMember"("communityId", "userId");
CREATE TABLE "new_FinixRevenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinixRevenue_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "CommunityPayment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FinixRevenue" ("amount", "createdAt", "id") SELECT "amount", "createdAt", "id" FROM "FinixRevenue";
DROP TABLE "FinixRevenue";
ALTER TABLE "new_FinixRevenue" RENAME TO "FinixRevenue";
CREATE UNIQUE INDEX "FinixRevenue_paymentId_key" ON "FinixRevenue"("paymentId");
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
    "subscriptionStatus" TEXT,
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
INSERT INTO "new_User" ("acceptingFollowers", "accountType", "avatarUrl", "bannerUrl", "bio", "bioLong", "certifications", "company", "createdAt", "email", "id", "instagramUrl", "isInfluencer", "isProfilePublic", "isVerified", "linkedinUrl", "location", "password", "riskScore", "role", "showPortfolio", "showStats", "specializations", "subscriptionStatus", "title", "totalReturn", "twitterUrl", "updatedAt", "username", "website", "winRate", "yearsExperience", "youtubeUrl") SELECT "acceptingFollowers", "accountType", "avatarUrl", "bannerUrl", "bio", "bioLong", "certifications", "company", "createdAt", "email", "id", "instagramUrl", "isInfluencer", "isProfilePublic", "isVerified", "linkedinUrl", "location", "password", "riskScore", "role", "showPortfolio", "showStats", "specializations", "subscriptionStatus", "title", "totalReturn", "twitterUrl", "updatedAt", "username", "website", "winRate", "yearsExperience", "youtubeUrl" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPayment_stripePaymentId_key" ON "CommunityPayment"("stripePaymentId");
