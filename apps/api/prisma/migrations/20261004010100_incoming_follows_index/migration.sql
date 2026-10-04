-- Incoming follows need followingId-first access; the PK is followerId-first.
-- One concurrent statement per migration, without a transaction wrapper.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Follow_following_follower_idx"
    ON "Follow" ("followingId", "followerId");
