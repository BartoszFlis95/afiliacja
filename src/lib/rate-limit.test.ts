import { afterEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Limiter chroni akcje wysyłające maile przez Resend. Błąd tutaj to albo
 * otwarta furtka do bombardowania czyjejś skrzynki i palenia naszego limitu
 * Resend, albo zablokowanie prawdziwym użytkownikom resetu hasła.
 *
 * Każdy test używa własnego klucza — stan limitera to moduł-singleton
 * współdzielony między testami.
 */
const klucz = (n: string) => `${n}:${Math.random().toString(36).slice(2)}`;

describe("checkRateLimit", () => {
  afterEach(() => vi.useRealTimers());

  it("przepuszcza dokładnie 3 próby i blokuje czwartą", () => {
    const k = klucz("limit");
    expect(checkRateLimit(k).allowed).toBe(true);
    expect(checkRateLimit(k).allowed).toBe(true);
    expect(checkRateLimit(k).allowed).toBe(true);
    expect(checkRateLimit(k).allowed).toBe(false);
  });

  it("po przekroczeniu limitu podaje, za ile można ponowić", () => {
    const k = klucz("retry");
    for (let i = 0; i < 3; i++) checkRateLimit(k);
    const wynik = checkRateLimit(k);
    expect(wynik.allowed).toBe(false);
    if (!wynik.allowed) {
      expect(wynik.retryAfterMs).toBeGreaterThan(0);
      expect(wynik.retryAfterMs).toBeLessThanOrEqual(60 * 60 * 1000);
    }
  });

  it("kolejne zablokowane próby NIE przedłużają okna", () => {
    // inaczej atakujący sam by się zablokował na zawsze, ale i prawdziwy
    // użytkownik nigdy by się nie odblokował
    const k = klucz("brak-przedluzania");
    for (let i = 0; i < 3; i++) checkRateLimit(k);
    const pierwsza = checkRateLimit(k);
    const druga = checkRateLimit(k);
    if (!pierwsza.allowed && !druga.allowed) {
      expect(druga.retryAfterMs).toBeLessThanOrEqual(pierwsza.retryAfterMs);
    }
  });

  it("zwalnia limit po upływie godziny", () => {
    vi.useFakeTimers();
    const k = klucz("okno");
    for (let i = 0; i < 3; i++) checkRateLimit(k);
    expect(checkRateLimit(k).allowed).toBe(false);

    vi.setSystemTime(Date.now() + 60 * 60 * 1000 + 1000);
    expect(checkRateLimit(k).allowed).toBe(true);
  });

  it("liczy każdy klucz osobno — jeden adres nie blokuje innych", () => {
    const a = klucz("ip-a");
    const b = klucz("ip-b");
    for (let i = 0; i < 3; i++) checkRateLimit(a);
    expect(checkRateLimit(a).allowed).toBe(false);
    expect(checkRateLimit(b).allowed).toBe(true);
  });

  it("rozdziela akcje: wyczerpany reset hasła nie blokuje wysyłki weryfikacji", () => {
    const ip = Math.random().toString(36).slice(2);
    for (let i = 0; i < 3; i++) checkRateLimit(`forgot-password:${ip}`);
    expect(checkRateLimit(`forgot-password:${ip}`).allowed).toBe(false);
    expect(checkRateLimit(`resend-verification:${ip}`).allowed).toBe(true);
  });

  /**
   * Mapa kluczy nie może rosnąć bez ograniczeń — rotowanie adresów IP jest
   * trywialne, a limiter, który sam zjada pamięć i czas procesora, jest gorszy
   * niż jego brak. Test pilnuje, że po zalaniu wieloma adresami limiter nadal
   * odpowiada szybko i poprawnie egzekwuje limit.
   */
  it("wytrzymuje zalanie wieloma adresami i nadal egzekwuje limit", () => {
    const t0 = performance.now();
    for (let i = 0; i < 30_000; i++) checkRateLimit(`zalew:${i}`);
    const czasMs = performance.now() - t0;

    // Przed poprawką sprzątania 50 000 kluczy zajmowało ~8,5 s.
    expect(czasMs).toBeLessThan(2000);

    const swiezy = klucz("po-zalewie");
    expect(checkRateLimit(swiezy).allowed).toBe(true);
    expect(checkRateLimit(swiezy).allowed).toBe(true);
    expect(checkRateLimit(swiezy).allowed).toBe(true);
    expect(checkRateLimit(swiezy).allowed).toBe(false);
  });
});
