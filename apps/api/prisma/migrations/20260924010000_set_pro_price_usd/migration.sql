-- Keep existing platform settings in sync with the new public Pro price.
-- Missing settings are created lazily by StripeService with the same default.
UPDATE "PlatformSetting"
SET "value" = '4', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" IN ('PRO_INVESTOR_MONTHLY_PRICE_USD', 'PRO_MONTHLY_PRICE_USD');
