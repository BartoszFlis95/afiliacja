export function calculateCommissionSplit(
  orderValue: number,
  commissionRate: number,
  influencerCommissionRate: number
) {
  const totalCommission = (orderValue * commissionRate) / 100;
  const influencerCommission = (orderValue * influencerCommissionRate) / 100;
  const platformCommission = totalCommission - influencerCommission;

  return {
    totalCommission,
    influencerCommission,
    platformCommission,
  };
}
