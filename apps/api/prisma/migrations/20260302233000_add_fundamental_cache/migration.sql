-- CreateTable
CREATE TABLE "FundamentalSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "providerRequested" TEXT NOT NULL,
    "providerUsed" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "staleAt" DATETIME,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProviderHealth" (
    "provider" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL DEFAULT 'healthy',
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "consecutive429" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastFailureAt" DATETIME,
    "cooldownUntil" DATETIME,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "FundamentalSnapshot_cacheKey_key" ON "FundamentalSnapshot"("cacheKey");

-- CreateIndex
CREATE INDEX "FundamentalSnapshot_ticker_providerRequested_idx" ON "FundamentalSnapshot"("ticker", "providerRequested");

-- CreateIndex
CREATE INDEX "FundamentalSnapshot_expiresAt_idx" ON "FundamentalSnapshot"("expiresAt");
