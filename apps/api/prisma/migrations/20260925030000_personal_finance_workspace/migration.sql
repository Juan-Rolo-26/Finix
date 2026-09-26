CREATE TABLE "PersonalFinanceAccount" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "institution" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'bank',
  "currency" TEXT NOT NULL DEFAULT 'ARS',
  "balance" DECIMAL(20,4) NOT NULL DEFAULT 0,
  "hidden" BOOLEAN NOT NULL DEFAULT false,
  "changePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalFinanceAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonalFinanceTransaction" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "accountId" TEXT,
  "cardId" TEXT,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "description" TEXT NOT NULL,
  "merchant" TEXT,
  "category" TEXT NOT NULL DEFAULT 'Otros',
  "categoryKey" TEXT NOT NULL DEFAULT 'other',
  "type" TEXT NOT NULL DEFAULT 'expense',
  "amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'ARS',
  "status" TEXT NOT NULL DEFAULT 'confirmed',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalFinanceTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonalFinanceBudget" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "categoryKey" TEXT NOT NULL,
  "limit" DECIMAL(20,4) NOT NULL DEFAULT 0,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalFinanceBudget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonalFinanceGoal" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT '○',
  "saved" DECIMAL(20,4) NOT NULL DEFAULT 0,
  "target" DECIMAL(20,4) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'ARS',
  "deadline" TIMESTAMP(3),
  "monthlyContribution" DECIMAL(20,4) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalFinanceGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonalFinanceRecurringPayment" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "accountId" TEXT,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Suscripciones',
  "amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'ARS',
  "nextDate" TIMESTAMP(3) NOT NULL,
  "frequency" TEXT NOT NULL DEFAULT 'monthly',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalFinanceRecurringPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonalFinanceCard" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "accountId" TEXT,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL DEFAULT 'Visa',
  "last4" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'ARS',
  "creditLimit" DECIMAL(20,4) NOT NULL DEFAULT 0,
  "currentBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
  "closingDay" INTEGER,
  "dueDay" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalFinanceCard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PersonalFinanceAccount_userId_idx" ON "PersonalFinanceAccount"("userId");
CREATE INDEX "PersonalFinanceTransaction_userId_date_idx" ON "PersonalFinanceTransaction"("userId", "date");
CREATE INDEX "PersonalFinanceTransaction_userId_categoryKey_date_idx" ON "PersonalFinanceTransaction"("userId", "categoryKey", "date");
CREATE INDEX "PersonalFinanceTransaction_accountId_idx" ON "PersonalFinanceTransaction"("accountId");
CREATE INDEX "PersonalFinanceTransaction_cardId_idx" ON "PersonalFinanceTransaction"("cardId");
CREATE UNIQUE INDEX "PersonalFinanceBudget_userId_categoryKey_month_year_key" ON "PersonalFinanceBudget"("userId", "categoryKey", "month", "year");
CREATE INDEX "PersonalFinanceBudget_userId_year_month_idx" ON "PersonalFinanceBudget"("userId", "year", "month");
CREATE INDEX "PersonalFinanceGoal_userId_idx" ON "PersonalFinanceGoal"("userId");
CREATE INDEX "PersonalFinanceRecurringPayment_userId_nextDate_idx" ON "PersonalFinanceRecurringPayment"("userId", "nextDate");
CREATE INDEX "PersonalFinanceCard_userId_idx" ON "PersonalFinanceCard"("userId");

ALTER TABLE "PersonalFinanceAccount" ADD CONSTRAINT "PersonalFinanceAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalFinanceTransaction" ADD CONSTRAINT "PersonalFinanceTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalFinanceTransaction" ADD CONSTRAINT "PersonalFinanceTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PersonalFinanceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonalFinanceTransaction" ADD CONSTRAINT "PersonalFinanceTransaction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "PersonalFinanceCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonalFinanceBudget" ADD CONSTRAINT "PersonalFinanceBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalFinanceGoal" ADD CONSTRAINT "PersonalFinanceGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalFinanceRecurringPayment" ADD CONSTRAINT "PersonalFinanceRecurringPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalFinanceRecurringPayment" ADD CONSTRAINT "PersonalFinanceRecurringPayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PersonalFinanceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonalFinanceCard" ADD CONSTRAINT "PersonalFinanceCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalFinanceCard" ADD CONSTRAINT "PersonalFinanceCard_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PersonalFinanceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
