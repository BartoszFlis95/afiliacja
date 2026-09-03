import { afterEach, describe, expect, it, vi } from "vitest";

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

    const { issuerSkonfigurowany, ISSUER } = await import("@/lib/site");
    expect(issuerSkonfigurowany()).toBe(true);
    expect(ISSUER.nip).toBe("5252445719");
  });

  it("fallbacki są widoczne jako zaślepki, nie jako prawdopodobne dane", async () => {
    vi.resetModules();
    for (const k of ["DENEEU_ISSUER_NAME","DENEEU_ISSUER_NIP","DENEEU_ISSUER_ADDRESS","DENEEU_ISSUER_CITY","DENEEU_ISSUER_POSTAL_CODE"]) delete process.env[k];
    const { ISSUER } = await import("@/lib/site");
    // stary default "0000000000" wyglądał jak prawdziwy NIP i przechodził niezauważony
    expect(ISSUER.nip).not.toMatch(/^\d+$/);
    expect(ISSUER.nip).toMatch(/BRAK/);
  });
});
