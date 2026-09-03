import { describe, expect, it } from "vitest";
import { normalizujIban, poprawneKontoWyplaty, poprawnyIban } from "./iban";
import { maskIban } from "./utils";

describe("poprawnyIban", () => {
  it("przyjmuje prawidłowy IBAN, także ze spacjami", () => {
    expect(poprawnyIban("PL61109010140000071219812874")).toBe(true);
    expect(poprawnyIban("PL61 1090 1014 0000 0712 1981 2874")).toBe(true);
    expect(poprawnyIban("pl61109010140000071219812874")).toBe(true);
  });

  it("odrzuca zbyt krótkie i zbyt długie", () => {
    expect(poprawnyIban("PL61")).toBe(false);
    expect(poprawnyIban("PL61" + "1".repeat(40))).toBe(false);
  });

  it("odrzuca zły układ znaków", () => {
    expect(poprawnyIban("1234567890123456")).toBe(false); // brak kodu kraju
    expect(poprawnyIban("PLXX109010140000071219812874")).toBe(false); // brak cyfr kontrolnych
  });

  it("normalizuje do postaci bez spacji, wielkimi literami", () => {
    expect(normalizujIban(" pl61 1090 ")).toBe("PL611090");
  });
});

describe("poprawneKontoWyplaty", () => {
  it("przyjmuje IBAN albo e-mail PayPal", () => {
    expect(poprawneKontoWyplaty("PL61109010140000071219812874")).toBe(true);
    expect(poprawneKontoWyplaty("ktos@example.com")).toBe(true);
  });

  it("odrzuca śmieci i wartości bez limitu długości", () => {
    expect(poprawneKontoWyplaty("moje konto")).toBe(false);
    expect(poprawneKontoWyplaty("1234")).toBe(false);
    expect(poprawneKontoWyplaty("a".repeat(65) + "@example.com")).toBe(false);
  });
});

describe("maskIban", () => {
  it("pokazuje kraj i cztery ostatnie znaki", () => {
    expect(maskIban("PL61109010140000071219812874")).toBe("PL**...2874");
  });

  it("zamyka się przy nietypowym wejściu, nie zwraca wartości w całości", () => {
    // regresja: wcześniej krótki ciąg wracał niezamaskowany prosto do maila
    expect(maskIban("PL612")).toBe("****");
    expect(maskIban("PL612")).not.toContain("612");
    expect(maskIban(null)).toBe("—");
  });
});
