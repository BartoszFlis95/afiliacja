-- AlterTable
ALTER TABLE "InfluencerProfile" ADD COLUMN     "bankAccountBank" TEXT,
ADD COLUMN     "bankAccountIban" TEXT,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankSwift" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "minimumPayout" DECIMAL(65,30) DEFAULT 100,
ADD COLUMN     "paypalEmail" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "preferredPayout" TEXT;
