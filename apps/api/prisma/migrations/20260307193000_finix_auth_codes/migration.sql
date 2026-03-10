-- AlterTable
ALTER TABLE "User"
ADD COLUMN "loginVerificationCode" TEXT,
ADD COLUMN "loginVerificationExpires" TIMESTAMP(3);
