-- CreateTable
CREATE TABLE "FundamentalData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticker" TEXT NOT NULL,
    "pe" REAL,
    "forwardPe" REAL,
    "ps" REAL,
    "pb" REAL,
    "evEbitda" REAL,
    "dividendYield" REAL,
    "roe" REAL,
    "roa" REAL,
    "netMargin" REAL,
    "operatingMargin" REAL,
    "grossMargin" REAL,
    "revenueGrowth3Y" REAL,
    "revenueGrowth5Y" REAL,
    "epsGrowth" REAL,
    "debtEquity" REAL,
    "currentRatio" REAL,
    "quickRatio" REAL,
    "freeCashFlow" REAL,
    "beta" REAL,
    "volatility" REAL,
    "maxDrawdown" REAL,
    "finixScore" REAL,
    "scoreDetails" TEXT,
    "aiSummary" TEXT,
    "strengths" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "sectorComparison" TEXT,
    "conclusion" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "FundamentalData_ticker_key" ON "FundamentalData"("ticker");
