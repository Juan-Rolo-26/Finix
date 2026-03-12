ALTER TABLE "Conversation"
ADD COLUMN "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "title" TEXT,
ADD COLUMN "createdById" TEXT,
ALTER COLUMN "participant1Id" DROP NOT NULL,
ALTER COLUMN "participant2Id" DROP NOT NULL;

CREATE TABLE "ConversationParticipant" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("conversationId","userId")
);

CREATE INDEX "Conversation_createdById_idx" ON "Conversation"("createdById");
CREATE INDEX "Conversation_isGroup_updatedAt_idx" ON "Conversation"("isGroup", "updatedAt");
CREATE INDEX "ConversationParticipant_userId_joinedAt_idx" ON "ConversationParticipant"("userId", "joinedAt");
CREATE INDEX "ConversationParticipant_conversationId_lastReadAt_idx" ON "ConversationParticipant"("conversationId", "lastReadAt");

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ConversationParticipant"
ADD CONSTRAINT "ConversationParticipant_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ConversationParticipant"
ADD CONSTRAINT "ConversationParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

INSERT INTO "ConversationParticipant" ("conversationId", "userId", "joinedAt", "lastReadAt")
SELECT "id", "participant1Id", "createdAt", CURRENT_TIMESTAMP
FROM "Conversation"
WHERE "participant1Id" IS NOT NULL
ON CONFLICT ("conversationId", "userId") DO NOTHING;

INSERT INTO "ConversationParticipant" ("conversationId", "userId", "joinedAt", "lastReadAt")
SELECT "id", "participant2Id", "createdAt", CURRENT_TIMESTAMP
FROM "Conversation"
WHERE "participant2Id" IS NOT NULL
ON CONFLICT ("conversationId", "userId") DO NOTHING;
