-- AlterTable
ALTER TABLE "Click" ADD COLUMN     "fraudReason" TEXT,
ADD COLUMN     "isFraud" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspiciousReason" TEXT;
