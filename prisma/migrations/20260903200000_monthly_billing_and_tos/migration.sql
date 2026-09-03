-- Miesięczny cykl rozliczeniowy + akceptacja regulaminu.
--
-- Wszystkie kolumny są NULLowalne, a klucze obce mają ON DELETE SET NULL:
-- usunięcie faktury nie może kasować prowizji ani wypłat, bo to dane
-- rozliczeniowe, które muszą przetrwać wycofanie dokumentu.

-- Powiązanie prowizji z fakturą zbiorczą
ALTER TABLE "Commission" ADD COLUMN "invoiceId" TEXT;

ALTER TABLE "Commission"
  ADD CONSTRAINT "Commission_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Commission_invoiceId_idx" ON "Commission"("invoiceId");

-- Powiązanie wypłaty z fakturą, której opłacenie ją odblokowuje
ALTER TABLE "Payout" ADD COLUMN "invoiceId" TEXT;

ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Payout_invoiceId_idx" ON "Payout"("invoiceId");

-- Akceptacja regulaminu i polityki prywatności.
-- Istniejące konta zostają z NULL — middleware skieruje je na /accept-terms.
ALTER TABLE "User" ADD COLUMN "tosAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "privacyAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "tosVersion" TEXT;
