-- Additive only: stores user requests and unsuccessful stock searches.
CREATE TABLE "AnalysisRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "query" VARCHAR(80) NOT NULL,
  "normalizedQuery" VARCHAR(80) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "searchCount" INTEGER NOT NULL DEFAULT 0,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalysisRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnalysisRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AnalysisRequest_userId_normalizedQuery_key" ON "AnalysisRequest"("userId", "normalizedQuery");
CREATE INDEX "AnalysisRequest_status_updatedAt_idx" ON "AnalysisRequest"("status", "updatedAt");
