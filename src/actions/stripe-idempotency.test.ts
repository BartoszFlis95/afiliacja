import { describe, expect, it } from "vitest";
import fs from "node:fs";

/**
 * Podwójna wypłata to najdroższy możliwy błąd w tym systemie: pieniądze
 * wychodzą i nic o tym nie informuje.
 *
 * Sprawdzenie `if (payout.stripeTransferId)` w kodzie NIE wystarcza — jest
 * odczytem oddzielonym od zapisu. Dwóch adminów klikających "wypłać"
 * jednocześnie odczyta null, przejdzie kontrolę statusu i utworzy dwa
 * transfery. Ten sam skutek daje padnięcie transakcji bazodanowej po udanym
 * transferze: wypłata zostaje w PROCESSING bez stripeTransferId, a ponowna
 * próba tworzy drugi transfer.
 *
 * Jedynym realnym zabezpieczeniem jest klucz idempotencji po stronie Stripe.
 * Testujemy obecność klucza w kodzie, bo zachowania współbieżnego nie da się
 * odtworzyć testem jednostkowym bez prawdziwego API Stripe — a brak klucza
 * jest dokładnie tym, co chcemy wykryć przy regresji.
 */
const KOD = fs.readFileSync("src/actions/stripe.actions.ts", "utf8");

describe("wypłaty Stripe — ochrona przed podwójnym transferem", () => {
  it("transfers.create dostaje klucz idempotencji", () => {
    expect(KOD).toMatch(/idempotencyKey:/);
  });

  it("klucz jest stały dla jednej próby wypłaty", () => {
    const m = KOD.match(/idempotencyKey:\s*`([^`]+)`/);
    expect(m, "nie znaleziono klucza idempotencji").not.toBeNull();
    expect(m![1]).toContain("${payoutId}");
  });

  /**
   * Klucz MUSI zawierać coś, co zmienia się przy ponowieniu. Po cofniętym
   * transferze wypłata jest otwierana ponownie (ten sam wiersz, bo
   * commissionId jest @unique), więc klucz oparty na samym payoutId zwróciłby
   * poprzedni, COFNIĘTY transfer — Stripe uznałby to za powtórzone żądanie
   * i wypłata po cichu by nie doszła.
   */
  it("klucz zmienia się przy ponowieniu wypłaty", () => {
    const m = KOD.match(/idempotencyKey:\s*`([^`]+)`/);
    expect(m![1]).toMatch(/requestedAt/);
  });

  it("ponowienie zeruje stripeTransferId i przesuwa requestedAt", () => {
    const komisje = fs.readFileSync("src/actions/commission.actions.ts", "utf8");
    // upsert, bo commissionId jest @unique i drugiego wiersza nie da się dodać
    expect(komisje).toMatch(/payout\.upsert/);
    const update = komisje.slice(komisje.indexOf("payout.upsert"));
    expect(update).toMatch(/stripeTransferId:\s*null/);
    expect(update).toMatch(/requestedAt:\s*new Date\(\)/);
  });

  it("cofnięcie transferu przywraca prowizję do APPROVED", () => {
    const webhook = fs.readFileSync("src/app/api/stripe/webhook/route.ts", "utf8");
    const blok = webhook.slice(webhook.indexOf("transfer.reversed"));
    expect(blok, "Commission zostaje PAID mimo cofniętego transferu")
      .toMatch(/CommissionStatus\.APPROVED/);
    expect(blok, "Conversion zostaje PAID mimo cofniętego transferu")
      .toMatch(/ConversionStatus\.CONFIRMED/);
  });

  it("transfer_group NIE jest traktowany jako zabezpieczenie", () => {
    // transfer_group to tylko etykieta grupująca — gdyby ktoś usunął klucz
    // idempotencji uznając, że transfer_group wystarcza, ten test to wyłapie
    const maKlucz = /idempotencyKey:/.test(KOD);
    const maGrupe = /transfer_group:/.test(KOD);
    expect(maGrupe && !maKlucz, "została sama grupa bez klucza idempotencji").toBe(false);
  });

  it("transfer wykonuje się dopiero po sprawdzeniu statusu PROCESSING", () => {
    const iStatus = KOD.indexOf("PayoutStatus.PROCESSING");
    const iTransfer = KOD.indexOf("stripe.transfers.create");
    expect(iStatus).toBeGreaterThan(-1);
    expect(iTransfer).toBeGreaterThan(iStatus);
  });

  it("konfiguracja Stripe jest sprawdzana przed dotknięciem wypłaty", () => {
    const iGuard = KOD.indexOf('grupaSkonfigurowana("wypłaty (Stripe)")');
    const iTransfer = KOD.indexOf("stripe.transfers.create");
    expect(iGuard).toBeGreaterThan(-1);
    expect(iTransfer).toBeGreaterThan(iGuard);
  });
});
