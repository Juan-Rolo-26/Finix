CREATE TABLE "SiteAnalyticsVisitor" (
    "id" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteAnalyticsVisitor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteAnalyticsSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeSeconds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SiteAnalyticsSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SiteAnalyticsSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "SiteAnalyticsVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SiteAnalyticsPageView" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibleSeconds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SiteAnalyticsPageView_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SiteAnalyticsPageView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SiteAnalyticsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SiteAnalyticsVisitor_firstSeenAt_idx" ON "SiteAnalyticsVisitor"("firstSeenAt");
CREATE INDEX "SiteAnalyticsVisitor_lastSeenAt_idx" ON "SiteAnalyticsVisitor"("lastSeenAt");
CREATE INDEX "SiteAnalyticsSession_startedAt_idx" ON "SiteAnalyticsSession"("startedAt");
CREATE INDEX "SiteAnalyticsSession_visitorId_startedAt_idx" ON "SiteAnalyticsSession"("visitorId", "startedAt");
CREATE INDEX "SiteAnalyticsPageView_startedAt_idx" ON "SiteAnalyticsPageView"("startedAt");
CREATE INDEX "SiteAnalyticsPageView_page_startedAt_idx" ON "SiteAnalyticsPageView"("page", "startedAt");
CREATE INDEX "SiteAnalyticsPageView_sessionId_startedAt_idx" ON "SiteAnalyticsPageView"("sessionId", "startedAt");
