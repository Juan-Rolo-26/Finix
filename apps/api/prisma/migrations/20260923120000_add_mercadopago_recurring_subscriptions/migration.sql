ALTER TABLE "Subscription"
ADD COLUMN "mercadoPagoPreapprovalId" TEXT,
ADD COLUMN "mercadoPagoExternalReference" TEXT,
ADD COLUMN "mercadoPagoPaymentId" TEXT;

CREATE UNIQUE INDEX "Subscription_mercadoPagoPreapprovalId_key"
ON "Subscription"("mercadoPagoPreapprovalId");

CREATE UNIQUE INDEX "Subscription_mercadoPagoPaymentId_key"
ON "Subscription"("mercadoPagoPaymentId");
