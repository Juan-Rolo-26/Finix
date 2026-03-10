ALTER TABLE "DirectMessage"
ADD COLUMN "attachmentType" TEXT,
ADD COLUMN "attachmentUrl" TEXT,
ADD COLUMN "attachmentData" TEXT,
ADD COLUMN "sharedPostId" TEXT;

CREATE INDEX "DirectMessage_sharedPostId_idx" ON "DirectMessage"("sharedPostId");

ALTER TABLE "DirectMessage"
ADD CONSTRAINT "DirectMessage_sharedPostId_fkey"
FOREIGN KEY ("sharedPostId") REFERENCES "Post"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
