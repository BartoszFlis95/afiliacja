-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "AffiliateLink_productId_idx" ON "AffiliateLink"("productId");

-- CreateIndex
CREATE INDEX "Click_affiliateLinkId_createdAt_idx" ON "Click"("affiliateLinkId", "createdAt");

-- CreateIndex
CREATE INDEX "Commission_influencerId_createdAt_idx" ON "Commission"("influencerId", "createdAt");

-- CreateIndex
CREATE INDEX "Commission_brandId_status_idx" ON "Commission"("brandId", "status");

-- CreateIndex
CREATE INDEX "Commission_status_createdAt_idx" ON "Commission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Commission_brandId_orderId_idx" ON "Commission"("brandId", "orderId");

-- CreateIndex
CREATE INDEX "Commission_isSuspicious_idx" ON "Commission"("isSuspicious");

-- CreateIndex
CREATE INDEX "Commission_affiliateLinkId_idx" ON "Commission"("affiliateLinkId");

-- CreateIndex
CREATE INDEX "Commission_productId_idx" ON "Commission"("productId");

-- CreateIndex
CREATE INDEX "Conversion_affiliateLinkId_status_idx" ON "Conversion"("affiliateLinkId", "status");

-- CreateIndex
CREATE INDEX "FraudLog_affiliateLinkId_idx" ON "FraudLog"("affiliateLinkId");

-- CreateIndex
CREATE INDEX "FraudLog_commissionId_idx" ON "FraudLog"("commissionId");

-- CreateIndex
CREATE INDEX "InviteCode_createdById_idx" ON "InviteCode"("createdById");

-- CreateIndex
CREATE INDEX "Invoice_brandId_periodFrom_idx" ON "Invoice"("brandId", "periodFrom");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Payout_influencerId_status_idx" ON "Payout"("influencerId", "status");

-- CreateIndex
CREATE INDEX "Payout_status_requestedAt_idx" ON "Payout"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "Product_brandProfileId_status_idx" ON "Product"("brandProfileId", "status");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
