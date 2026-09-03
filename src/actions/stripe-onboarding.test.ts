import fs from "node:fs";
import { describe, expect, it } from "vitest";

const STRIPE = fs.readFileSync("src/actions/stripe.actions.ts", "utf8");
const INFLUENCER = fs.readFileSync("src/actions/influencer.actions.ts", "utf8");

/**
 * Onboarding Stripe Connect. Błędy tutaj wychodzą dopiero przy pierwszej
 * wypłacie — czyli wtedy, gdy influencer już zarobił i czeka na pieniądze.
 */
describe("onboarding Stripe Connect", () => {
  /**
   * Typ konta Connect musi odpowiadać zadeklarowanemu typowi rozliczenia.
   * Wcześniej było zahardkodowane "individual": influencer rozliczający się
   * jako firma dostawał konto osoby fizycznej, Stripe prosił go przy KYC
   * o dokumenty osobiste zamiast firmowych, a wypłata na rachunek firmowy
   * bywała zatrzymywana.
   */
  it("typ konta wynika z zadeklarowanego typu rozliczenia, nie jest stały", () => {
    expect(STRIPE).not.toMatch(/business_type:\s*"individual"/);
    expect(STRIPE).toMatch(/business_type:\s*businessType/);
    expect(STRIPE).toMatch(/billingType === "COMPANY"\s*\?\s*"company"\s*:\s*"individual"/);
  });

  /**
   * Bez klucza idempotencji nieudany zapis do bazy PO utworzeniu konta
   * zostawiał osierocone konto Connect, a kolejna próba tworzyła następne —
   * bo w bazie nadal nie było stripeAccountId.
   */
  it("tworzenie konta Connect ma klucz idempotencji na profil", () => {
    const blok = STRIPE.slice(STRIPE.indexOf("stripe.accounts.create"));
    expect(blok).toMatch(/idempotencyKey:\s*`connect_account_\$\{profile\.id\}`/);
  });

  /**
   * Po utworzeniu konta Stripe nie pozwala przestawić business_type.
   * Ciche zapisanie nowej deklaracji u nas dałoby rozjazd: wystawialibyśmy
   * dokumenty jak firmie, a Stripe traktowałby konto jako osobę fizyczną.
   */
  it("zmiana typu rozliczenia jest blokowana po utworzeniu konta Stripe", () => {
    const blok = INFLUENCER.slice(INFLUENCER.indexOf("updateBillingTypeAction"));
    expect(blok).toMatch(/stripeAccountId/);
    expect(blok).toMatch(/Nie można zmienić typu rozliczenia/);
  });

  it("wypłaty Stripe są ręczne — to my decydujemy kiedy pieniądze wychodzą", () => {
    expect(STRIPE).toMatch(/schedule:\s*\{\s*interval:\s*"manual"\s*\}/);
  });
});
