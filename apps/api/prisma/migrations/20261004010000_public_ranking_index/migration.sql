-- Public rankings filter visibility/stats opt-in before sorting by return.
-- Keep one statement per migration: PostgreSQL cannot build a concurrent index
-- in the implicit transaction created by a multi-statement Prisma script.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_public_ranking_idx"
    ON "User" ("isProfilePublic", "showStats", "totalReturn" DESC);
