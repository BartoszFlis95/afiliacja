import { describe, expect, it } from "vitest";

import { calculateCommissionSplit } from "@/lib/commission";

/**
 * To jedyny kod w projekcie, który liczy pieniądze. Każdy błąd tutaj zamienia
 * się na złe kwoty w prowizjach, wypłatach i fakturach — i to po cichu, bo
 * nic go nie zgłosi.
 */
describe("calculateCommissionSplit", () => {
  it("dzieli prowizję zgodnie ze stawkami", () => {
    expect(calculateCommissionSplit(200, 15, 10)).toEqual({
      totalCommission: 30,
      influencerCommission: 20,
      platformCommission: 10,
    });
  });

  it("zaokrągla do groszy zamiast zostawiać szum zmiennoprzecinkowy", () => {
    // 199.99 * 15% = 29.9985 w arytmetyce float daje 29.998500000000003
    const { totalCommission } = calculateCommissionSplit(199.99, 15, 10);
    expect(totalCommission).toBe(30);
    expect(Number.isInteger(totalCommission * 100)).toBe(true);
  });

  it("nie zostawia ułamków grosza w żadnej z trzech kwot", () => {
    const wynik = calculateCommissionSplit(33.33, 3.3, 1.1);
    for (const kwota of Object.values(wynik)) {
      expect(Number.isInteger(Math.round(kwota * 100))).toBe(true);
      expect(kwota * 100).toBeCloseTo(Math.round(kwota * 100), 9);
    }
  });

  it("utrzymuje niezmiennik: influencer + platforma = całość", () => {
    const przypadki: Array<[number, number, number]> = [
      [200, 15, 10],
      [199.99, 15, 10],
      [33.33, 3.3, 1.1],
      [0.01, 10, 5],
      [999999.99, 12.5, 7.5],
      [49.9, 7, 3.5],
    ];
    for (const [kwota, total, inf] of przypadki) {
      const r = calculateCommissionSplit(kwota, total, inf);
      expect(Math.round((r.influencerCommission + r.platformCommission) * 100) / 100)
        .toBe(r.totalCommission);
    }
  });

  it("przy równych stawkach platforma nie zarabia nic", () => {
    const r = calculateCommissionSplit(100, 10, 10);
    expect(r.platformCommission).toBe(0);
    expect(r.influencerCommission).toBe(r.totalCommission);
  });

  it("dla zerowej kwoty zamówienia zwraca same zera", () => {
    expect(calculateCommissionSplit(0, 10, 5)).toEqual({
      totalCommission: 0,
      influencerCommission: 0,
      platformCommission: 0,
    });
  });

  /**
   * Ta funkcja sama z siebie NIE broni się przed stawką influencera wyższą od
   * całkowitej — zwróci wtedy ujemną prowizję platformy. Jedyne, co temu
   * zapobiega, to reguła .refine() w ProductSchema (test niżej). Ten przypadek
   * jest tu zapisany świadomie: gdyby ktoś kiedyś usunął tamtą walidację,
   * powinien zobaczyć w tym miejscu, co się wtedy dzieje.
   */
  it("zwraca ujemną prowizję platformy, gdy stawka influencera przewyższa całkowitą", () => {
    expect(calculateCommissionSplit(100, 5, 10).platformCommission).toBe(-5);
  });
});
