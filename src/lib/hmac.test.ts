import crypto from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyHmacSignature } from "@/lib/hmac";

const SECRET = "webhook-secret-marki";
const BODY = JSON.stringify({ orderId: "ORD-1", amount: 199.99, ref: "abc123" });
const POPRAWNY = crypto.createHmac("sha256", SECRET).update(BODY).digest("hex");

/**
 * Ta funkcja jest jedyną barierą między publicznym endpointem /api/conversion
 * a tworzeniem prowizji. Przyjmuje wyłącznie poprawny podpis — reszta musi
 * odpaść.
 */
describe("verifyHmacSignature", () => {
  it("przyjmuje poprawny podpis", () => {
    expect(verifyHmacSignature(BODY, POPRAWNY, SECRET)).toBe(true);
  });

  it("odrzuca podpis różniący się jednym znakiem", () => {
    const ostatni = POPRAWNY.slice(-1);
    const podmieniony = POPRAWNY.slice(0, -1) + (ostatni === "a" ? "b" : "a");
    expect(verifyHmacSignature(BODY, podmieniony, SECRET)).toBe(false);
  });

  it("odrzuca podpis o poprawnym prefiksie, ale złej reszcie", () => {
    // dokładnie ten scenariusz, który wykorzystuje atak czasowy
    const prefiks = POPRAWNY.slice(0, 32) + "0".repeat(32);
    expect(verifyHmacSignature(BODY, prefiks, SECRET)).toBe(false);
  });

  it("odrzuca podpis o innej długości bez rzucania wyjątku", () => {
    expect(() => verifyHmacSignature(BODY, POPRAWNY.slice(0, 10), SECRET)).not.toThrow();
    expect(verifyHmacSignature(BODY, POPRAWNY.slice(0, 10), SECRET)).toBe(false);
    expect(verifyHmacSignature(BODY, POPRAWNY + "ff", SECRET)).toBe(false);
  });

  it("odrzuca brak podpisu i pusty podpis", () => {
    expect(verifyHmacSignature(BODY, null, SECRET)).toBe(false);
    expect(verifyHmacSignature(BODY, "", SECRET)).toBe(false);
  });

  it("odrzuca podpis policzony innym sekretem", () => {
    const obcy = crypto.createHmac("sha256", "inny-sekret").update(BODY).digest("hex");
    expect(verifyHmacSignature(BODY, obcy, SECRET)).toBe(false);
  });

  it("odrzuca poprawny podpis dla ZMIENIONEGO body", () => {
    const podmienioneBody = BODY.replace("199.99", "19999");
    expect(verifyHmacSignature(podmienioneBody, POPRAWNY, SECRET)).toBe(false);
  });

  it("odrzuca, gdy sekret jest pusty", () => {
    expect(verifyHmacSignature(BODY, POPRAWNY, "")).toBe(false);
  });
});

/**
 * Test na WŁAŚCIWOŚĆ, nie na zachowanie.
 *
 * Powyższe testy nie wykryłyby powrotu do `signature === expected` — zwykłe
 * porównanie zwraca dokładnie te same wyniki, a różnica jest wyłącznie
 * w czasie wykonania, którego test jednostkowy nie mierzy. Sprawdzone
 * empirycznie: podmiana implementacji na `===` przechodziła wszystkie
 * osiem testów wyżej.
 *
 * Dlatego tutaj sprawdzamy, ŻE użyto crypto.timingSafeEqual. To jedyny sposób,
 * żeby zablokować cichą regresję do porównania podatnego na atak czasowy.
 */
describe("verifyHmacSignature — odporność na atak czasowy", () => {
  afterEach(() => vi.restoreAllMocks());

  it("porównuje podpisy przez crypto.timingSafeEqual", () => {
    const spy = vi.spyOn(crypto, "timingSafeEqual");
    verifyHmacSignature(BODY, POPRAWNY, SECRET);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("nie wywołuje timingSafeEqual, gdy długości się różnią (rzuciłoby wyjątkiem)", () => {
    const spy = vi.spyOn(crypto, "timingSafeEqual");
    expect(verifyHmacSignature(BODY, POPRAWNY.slice(0, 10), SECRET)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
