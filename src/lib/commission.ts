// Zaokrąglamy do 2 miejsc (grosze) — bez tego JS float arithmetic zapisuje do
// bazy wartości typu 9.999500000000001 zamiast czystego 10.00 (wykryte w
// testach E2E: 199.99 * 15% zostawiało szum zmiennoprzecinkowy w Decimal).
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateCommissionSplit(
  orderValue: number,
  commissionRate: number,
  influencerCommissionRate: number
) {
  const totalCommission = round2((orderValue * commissionRate) / 100);
  const influencerCommission = round2((orderValue * influencerCommissionRate) / 100);
  const platformCommission = round2(totalCommission - influencerCommission);

  return {
    totalCommission,
    influencerCommission,
    platformCommission,
  };
}
