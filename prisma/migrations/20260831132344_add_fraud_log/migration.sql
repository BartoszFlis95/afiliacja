-- CreateEnum
CREATE TYPE "FraudType" AS ENUM ('SELF_CLICK', 'IP_RATE_LIMIT', 'SUSPICIOUS_CONVERSION', 'COOLING_PERIOD');

-- CreateTable
CREATE TABLE "FraudLog" (
    "id" TEXT NOT NULL,
    "type" "FraudType" NOT NULL,
    "affiliateLinkId" TEXT,
    "commissionId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FraudLog_type_idx" ON "FraudLog"("type");

-- CreateIndex
CREATE INDEX "FraudLog_createdAt_idx" ON "FraudLog"("createdAt");

-- AddForeignKey
ALTER TABLE "FraudLog" ADD CONSTRAINT "FraudLog_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "AffiliateLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudLog" ADD CONSTRAINT "FraudLog_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
