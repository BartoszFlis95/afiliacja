-- DropIndex
DROP INDEX "Conversion_orderId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Conversion_orderId_affiliateLinkId_key" ON "Conversion"("orderId", "affiliateLinkId");
