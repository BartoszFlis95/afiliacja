-- Minimum payout is now a platform-wide constant (50 PLN, enforced in
-- requestPayoutAction) instead of a per-influencer configurable value.
ALTER TABLE "InfluencerProfile" DROP COLUMN "minimumPayout";
