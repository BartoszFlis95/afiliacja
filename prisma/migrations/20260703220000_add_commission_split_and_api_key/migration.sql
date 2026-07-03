-- Product: add influencerCommissionRate
ALTER TABLE "Product" ADD COLUMN "influencerCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- BrandProfile: add apiKey and webhookSecret
-- Add as nullable first so existing rows can be populated
ALTER TABLE "BrandProfile" ADD COLUMN "apiKey" TEXT;
ALTER TABLE "BrandProfile" ADD COLUMN "webhookSecret" TEXT;

-- Populate existing rows with unique random values (md5 of random UUID)
UPDATE "BrandProfile"
SET
  "apiKey"        = md5(random()::text || id || now()::text),
  "webhookSecret" = md5(random()::text || id || clock_timestamp()::text)
WHERE "apiKey" IS NULL;

-- Make NOT NULL and add UNIQUE constraint
ALTER TABLE "BrandProfile" ALTER COLUMN "apiKey" SET NOT NULL;
ALTER TABLE "BrandProfile" ALTER COLUMN "webhookSecret" SET NOT NULL;
CREATE UNIQUE INDEX "BrandProfile_apiKey_key" ON "BrandProfile"("apiKey");

-- Conversion: add new fields
ALTER TABLE "Conversion" ADD COLUMN "orderId" TEXT;
ALTER TABLE "Conversion" ADD COLUMN "customerEmail" TEXT;
ALTER TABLE "Conversion" ADD COLUMN "influencerCommission" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Conversion" ADD COLUMN "platformCommission" DECIMAL(65,30) NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "Conversion_orderId_key" ON "Conversion"("orderId");
