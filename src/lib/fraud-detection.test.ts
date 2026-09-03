import { beforeEach, describe, expect, it, vi } from "vitest";

const aggregate = vi.fn();
const count = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    commission: {
      aggregate: (...a: unknown[]) => aggregate(...a),
      count: (...a: unknown[]) => count(...a),
    },
  },
}));

const { oznaczPodejrzanaKonwersje } = await import("@/lib/fraud-detection");

beforeEach(() => {
  aggregate.mockReset().mockResolvedValue({ _avg: { orderValue: null } });
  count.mockReset().mockResolvedValue(0);
});

describe("oznaczanie podejrzanych konwersji", () => {
  it("pierwsza konwersja bez historii nie jest podejrzana", async () => {
    const w = await oznaczPodejrzanaKonwersje({
      affiliateLinkId: "l1", orderValue: 199.99, productPrice: 199.99, clickIp: null,
    });
    expect(w.isSuspicious).toBe(false);
  });

  it("oznacza kwotę wielokrotnie przewyższającą cenę katalogową", async () => {
    const w = await oznaczPodejrzanaKonwersje({
      affiliateLinkId: "l1", orderValue: 100_000, productPrice: 100, clickIp: null,
    });
    expect(w.isSuspicious).toBe(true);
    expect(w.powody.join()).toMatch(/ceny katalogowej/);
  });

  /**
   * NAJWAŻNIEJSZY TEST TEGO PLIKU.
   *
   * Przed poprawką średnia obejmowała WSZYSTKIE konwersje, także oznaczone
   * jako oszukańcze — więc każda przyjęta podnosiła próg dla następnej.
   * Model pokazał, że limit 10 000 zł dawało się w czterech krokach rozgrzać
   * do 9,2 mld zł, i żadna z tych konwersji nie zostawała oznaczona.
   *
   * Teraz średnia liczy się TYLKO z konwersji nieoznaczonych, a niezależnym
   * odniesieniem jest cena katalogowa, której konwersjami podnieść się nie da.
   */
  it("nie da się rozgrzać progu wcześniejszymi oszukańczymi konwersjami", async () => {
    // baza uczciwych konwersji: średnia 100 zł, cena katalogowa 100 zł
    aggregate.mockResolvedValue({ _avg: { orderValue: 100 } });

    // Sufit z ceny katalogowej wynosi 100 x 100 = 10 000 zł i JEST STAŁY —
    // konwersjami się go nie podnosi, bo cenę ustala marka.
    const ponizejSufitu = await oznaczPodejrzanaKonwersje({
      affiliateLinkId: "l1", orderValue: 9_999, productPrice: 100, clickIp: null,
    });
    expect(ponizejSufitu.isSuspicious).toBe(false);

    const powyzejSufitu = await oznaczPodejrzanaKonwersje({
      affiliateLinkId: "l1", orderValue: 10_001, productPrice: 100, clickIp: null,
    });
    expect(powyzejSufitu.isSuspicious).toBe(true);
    expect(powyzejSufitu.powody.join()).toMatch(/ceny katalogowej/);

    // Sedno poprawki: średnia liczona jest WYŁĄCZNIE z konwersji nieoznaczonych,
    // więc przyjęta oszukańcza konwersja nie podnosi progu dla następnej.
    const filtr = aggregate.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(filtr.where).toMatchObject({ isSuspicious: false });
  });

  it("bez ceny katalogowej nadal działa odniesienie do średniej", async () => {
    aggregate.mockResolvedValue({ _avg: { orderValue: 50 } });
    const w = await oznaczPodejrzanaKonwersje({
      affiliateLinkId: "l1", orderValue: 6_000, productPrice: null, clickIp: null,
    });
    expect(w.isSuspicious).toBe(true);
    expect(w.powody.join()).toMatch(/średniej/);
  });

  it("oznacza wiele konwersji powiązanych z tym samym adresem IP", async () => {
    count.mockResolvedValue(5);
    const w = await oznaczPodejrzanaKonwersje({
      affiliateLinkId: "l1", orderValue: 100, productPrice: 100, clickIp: "203.0.113.7",
    });
    expect(w.isSuspicious).toBe(true);
    expect(w.powody.join()).toMatch(/adresem IP/);
  });

  it("nie sprawdza adresu IP, gdy go nie znamy", async () => {
    await oznaczPodejrzanaKonwersje({
      affiliateLinkId: "l1", orderValue: 100, productPrice: 100, clickIp: null,
    });
    expect(count).not.toHaveBeenCalled();
  });

  it("skleja wszystkie powody w jeden opis dla admina", async () => {
    aggregate.mockResolvedValue({ _avg: { orderValue: 10 } });
    count.mockResolvedValue(9);
    const w = await oznaczPodejrzanaKonwersje({
      affiliateLinkId: "l1", orderValue: 50_000, productPrice: 100, clickIp: "203.0.113.7",
    });
    expect(w.powody.length).toBe(3);
    expect(w.suspiciousReason).toContain(";");
  });
});
