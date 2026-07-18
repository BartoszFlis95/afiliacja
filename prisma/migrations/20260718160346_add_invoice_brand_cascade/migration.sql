-- Invoice.brand was missing onDelete: Cascade, unlike every other BrandProfile
-- relation (Product, Commission). This meant deleting a User/BrandProfile that
-- had ever had an invoice generated failed with a foreign key violation
-- instead of cascading, as discovered during E2E test cleanup.
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_brandId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
