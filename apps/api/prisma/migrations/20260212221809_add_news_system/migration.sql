/*
  Warnings:

  - You are about to drop the `Movement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `cantidad` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `montoInvertido` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `portfolioId` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `ppc` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `precioActual` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `tipoActivo` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Asset` table. All the data in the column will be lost.
  - Added the required column `name` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Asset` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Movement";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL DEFAULT 0,
    "averageCost" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "Holding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Holding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "assetId" TEXT,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DECIMAL NOT NULL DEFAULT 0,
    "pricePerUnit" DECIMAL NOT NULL DEFAULT 0,
    "fee" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "CashAccount_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NewsSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "apiType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NewsCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleEs" TEXT,
    "content" TEXT NOT NULL,
    "contentEs" TEXT,
    "summary" TEXT NOT NULL,
    "summaryEs" TEXT,
    "url" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "imageUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "wasTranslated" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "sourceId" TEXT NOT NULL,
    "author" TEXT,
    "sentiment" TEXT,
    "sentimentScore" REAL,
    "impactLevel" TEXT,
    "tickers" TEXT NOT NULL DEFAULT '',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "News_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NewsCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "News_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD'
);
INSERT INTO "new_Asset" ("id", "ticker") SELECT "id", "ticker" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE UNIQUE INDEX "Asset_ticker_key" ON "Asset"("ticker");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Holding_portfolioId_assetId_key" ON "Holding"("portfolioId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "CashAccount_portfolioId_currency_key" ON "CashAccount"("portfolioId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "NewsSource_name_key" ON "NewsSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NewsCategory_name_key" ON "NewsCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NewsCategory_slug_key" ON "NewsCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "News_url_key" ON "News"("url");

-- CreateIndex
CREATE UNIQUE INDEX "News_urlHash_key" ON "News"("urlHash");

-- CreateIndex
CREATE INDEX "News_publishedAt_idx" ON "News"("publishedAt");

-- CreateIndex
CREATE INDEX "News_categoryId_idx" ON "News"("categoryId");

-- CreateIndex
CREATE INDEX "News_sourceId_idx" ON "News"("sourceId");

-- CreateIndex
CREATE INDEX "News_sentiment_idx" ON "News"("sentiment");
