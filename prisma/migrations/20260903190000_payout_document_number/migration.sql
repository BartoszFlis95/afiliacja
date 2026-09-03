-- Trwały numer rachunku.
-- Kolumna jest NULLowalna celowo: kod potrafi działać przed backfillem,
-- wyliczając numer po staremu, gdy kolumna jest pusta.
ALTER TABLE "Payout" ADD COLUMN "documentNumber" TEXT;

ALTER TABLE "Payout" ADD COLUMN "documentSeq" INTEGER;

CREATE UNIQUE INDEX "Payout_documentNumber_key" ON "Payout"("documentNumber");

-- wyszukiwanie najwyższej pozycji w roku
CREATE INDEX "Payout_documentSeq_idx" ON "Payout"("documentSeq");
