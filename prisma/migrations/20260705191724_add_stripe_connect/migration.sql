-- AlterTable
ALTER TABLE "InfluencerProfile" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeAccountStatus" TEXT,
ADD COLUMN     "stripeOnboardingDone" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paidViaStripe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutsTriggered" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "payoutMethod" TEXT,
ADD COLUMN     "stripeTransferId" TEXT;
