ALTER TABLE "PersonalFinanceTransaction" ADD COLUMN "details" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "PersonalFinanceTransaction" ADD COLUMN "importKey" TEXT;
CREATE UNIQUE INDEX "PersonalFinanceTransaction_userId_importKey_key" ON "PersonalFinanceTransaction"("userId", "importKey");
ALTER TABLE "PersonalFinanceBudget" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'ARS';
ALTER TABLE "PersonalFinanceBudget" ADD COLUMN "alertAt" INTEGER NOT NULL DEFAULT 80;
DROP INDEX "PersonalFinanceBudget_userId_categoryKey_month_year_key";
CREATE UNIQUE INDEX "PersonalFinanceBudget_userId_categoryKey_month_year_currency_key" ON "PersonalFinanceBudget"("userId","categoryKey","month","year","currency");
CREATE TABLE "PersonalFinancePreferences" (
  "userId" TEXT PRIMARY KEY,
  "data" TEXT NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalFinancePreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
