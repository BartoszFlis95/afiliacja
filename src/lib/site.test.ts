import { afterEach, describe, expect, it, vi } from "vitest";
import { NOTA_KLEINUNTERNEHMER } from "@/lib/site";

/**
 * Faktura zapisuje migawkę danych wystawcy. Zanim to naprawiono, generowanie
 * nie ustawiało tych pól wcale, więc Prisma wstawiała domyślne ze schematu:
 * NIP "0000000000" i adres "ul. Przykładowa 1". Faktura z fikcyjnym NIP-em
 * sprzedawcy jest w Polsce nieważna — nabywca nie odliczy z niej VAT-u.
 */
describe("dane wystawcy faktur", () => {
  const oryginalne = { ...process.env };
  afterEach(() => {
    process.env = { ...oryginalne };
    vi.resetModules();
  });

  it("uznaje konfigurację za niekompletną, gdy brakuje choćby jednej zmiennej", async () => {
    for (const brakujaca of [
      "DENEEU_ISSUER_NAME", "DENEEU_ISSUER_NIP", "DENEEU_ISSUER_ADDRESS",
      "DENEEU_ISSUER_CITY", "DENEEU_ISSUER_POSTAL_CODE",
    ]) {
      vi.resetModules();
      process.env.DENEEU_ISSUER_NAME = "Deneeu Sp. z o.o.";
      process.env.DENEEU_ISSUER_NIP = "5252445719";
      process.env.DENEEU_ISSUER_ADDRESS = "ul. Prosta 51";
      process.env.DENEEU_ISSUER_CITY = "Warszawa";
      process.env.DENEEU_ISSUER_POSTAL_CODE = "00-838";
      delete process.env[brakujaca];

      const { issuerSkonfigurowany } = await import("@/lib/site");
      expect(issuerSkonfigurowany(), `brak ${brakujaca}`).toBe(false);
    }
  });

  it("uznaje konfigurację za kompletną, gdy wszystkie zmienne są ustawione", async () => {
    vi.resetModules();
    process.env.DENEEU_ISSUER_NAME = "Deneeu Sp. z o.o.";
    process.env.DENEEU_ISSUER_NIP = "5252445719";
    process.env.DENEEU_ISSUER_ADDRESS = "ul. Prosta 51";
    process.env.DENEEU_ISSUER_CITY = "Warszawa";
    process.env.DENEEU_ISSUER_POSTAL_CODE = "00-838";
    // kraj i rachunek doszły wraz z obsługą wystawcy niemieckiego
    process.env.DENEEU_ISSUER_COUNTRY = "Poland";
    process.env.DENEEU_ISSUER_BANK_IBAN = "PL61109010140000071219812874";

    const { issuerSkonfigurowany, ISSUER } = await import("@/lib/site");
    expect(issuerSkonfigurowany()).toBe(true);
    expect(ISSUER.taxId).toBe("5252445719");
  });

  it("bez kraju konfiguracja jest niekompletna", async () => {
    vi.resetModules();
    process.env.DENEEU_ISSUER_NAME = "Deneeu UG";
    process.env.DENEEU_ISSUER_TAX_ID = "12/345/67890";
    process.env.DENEEU_ISSUER_ADDRESS = "Musterstraße 12";
    process.env.DENEEU_ISSUER_CITY = "Berlin";
    process.env.DENEEU_ISSUER_POSTAL_CODE = "10115";
    process.env.DENEEU_ISSUER_BANK_IBAN = "DE89370400440532013000";
    delete process.env.DENEEU_ISSUER_COUNTRY;

    const { issuerSkonfigurowany } = await import("@/lib/site");
    expect(issuerSkonfigurowany()).toBe(false);
  });

  it("bez rachunku konfiguracja jest niekompletna — nabywca nie ma dokąd zapłacić", async () => {
    vi.resetModules();
    process.env.DENEEU_ISSUER_COUNTRY = "Germany";
    delete process.env.DENEEU_ISSUER_BANK_IBAN;
    delete process.env.DENEEU_BANK_ACCOUNT;

    const { issuerSkonfigurowany } = await import("@/lib/site");
    expect(issuerSkonfigurowany()).toBe(false);
  });

  it("fallbacki są widoczne jako zaślepki, nie jako prawdopodobne dane", async () => {
    vi.resetModules();
    for (const k of ["DENEEU_ISSUER_NAME","DENEEU_ISSUER_NIP","DENEEU_ISSUER_ADDRESS","DENEEU_ISSUER_CITY","DENEEU_ISSUER_POSTAL_CODE"]) delete process.env[k];
    const { ISSUER } = await import("@/lib/site");
    // stary default "0000000000" wyglądał jak prawdziwy NIP i przechodził niezauważony
    expect(ISSUER.taxId).not.toMatch(/^\d+$/);
    expect(ISSUER.taxId).toMatch(/BRAK/);
  });
});

describe("Kleinunternehmer (§ 19 UStG)", () => {
  it("nota ma dokładne brzmienie wymagane przepisem", () => {
    // Treść jest ustawowa — dowolna parafraza czyni fakturę wadliwą.
    // Tekstu w PDF nie da się asertować (strumienie są skompresowane),
    // więc to jedyne miejsce, gdzie da się przypilnować brzmienia.
    expect(NOTA_KLEINUNTERNEHMER).toBe(
      "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
    );
  });

  it("zwolnienie wymaga dosłownego 'true'", async () => {
    const poprzednia = process.env.DENEEU_ISSUER_VAT_FREE;
    for (const wartosc of ["1", "yes", "True", "TRUE", "tak", ""]) {
      process.env.DENEEU_ISSUER_VAT_FREE = wartosc;
      vi.resetModules();
      const { ISSUER } = await import("./site");
      // literówka ma dać stawkę podstawową: pomyłka w tę stronę jest
      // odwracalna korektą, w drugą to zaniżony podatek
      expect(ISSUER.vatFree, `wartość ${JSON.stringify(wartosc)}`).toBe(false);
    }
    process.env.DENEEU_ISSUER_VAT_FREE = "true";
    vi.resetModules();
    expect((await import("./site")).ISSUER.vatFree).toBe(true);
    process.env.DENEEU_ISSUER_VAT_FREE = poprzednia;
    vi.resetModules();
  });

  it("adres wystawcy zawiera kraj — przy sprzedaży transgranicznej jest wymagany", async () => {
    const stare = { ...process.env };
    Object.assign(process.env, {
      DENEEU_ISSUER_ADDRESS: "Musterstraße 12",
      DENEEU_ISSUER_POSTAL_CODE: "10115",
      DENEEU_ISSUER_CITY: "Berlin",
      DENEEU_ISSUER_COUNTRY: "Germany",
    });
    vi.resetModules();
    const { adresWystawcy } = await import("./site");
    expect(adresWystawcy()).toBe("Musterstraße 12, 10115 Berlin, Germany");
    process.env = stare;
    vi.resetModules();
  });
});
