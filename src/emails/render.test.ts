import type * as React from "react";
import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import AdminTransferFailedEmail from "@/emails/AdminTransferFailedEmail";
import CommissionApprovedEmail from "@/emails/CommissionApprovedEmail";
import CommissionPendingBrandEmail from "@/emails/CommissionPendingBrandEmail";
import InvoiceEmail from "@/emails/InvoiceEmail";
import NewCommissionEmail from "@/emails/NewCommissionEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import PayoutApprovedEmail from "@/emails/PayoutApprovedEmail";
import PayoutCompletedEmail from "@/emails/PayoutCompletedEmail";
import VerifyEmailEmail from "@/emails/VerifyEmailEmail";
import WelcomeEmail from "@/emails/WelcomeEmail";

/**
 * Maile to jedyny kod w projekcie, którego efektu nikt nie ogląda przed
 * dostarczeniem do cudzej skrzynki — błąd wychodzi dopiero u odbiorcy,
 * a wysłanego maila nie da się cofnąć.
 *
 * Propsy odwzorowują to, co przekazują PRAWDZIWE wywołania (actions/*, api/*),
 * a nie to, co wygodnie było mi wymyślić.
 */
type Przypadek = [string, () => React.ReactElement];

const KOMPLETNE: Przypadek[] = [
  ["WelcomeEmail", () => WelcomeEmail({ name: "Kasia", role: "INFLUENCER" })],
  ["WelcomeEmail/BRAND", () => WelcomeEmail({ name: "TechStore", role: "BRAND" })],
  ["VerifyEmailEmail", () => VerifyEmailEmail({ name: "Kasia", verifyUrl: "https://www.deneeu.pl/verify-email?token=abc" })],
  ["PasswordResetEmail", () => PasswordResetEmail({ name: "Kasia", resetUrl: "https://www.deneeu.pl/reset-password?token=abc" })],
  ["NewCommissionEmail", () => NewCommissionEmail({ influencerName: "Kasia", productName: "Koszulka", brandName: "TechStore", orderValue: 199.99, commissionAmount: 29.99, commissionPercent: 15 })],
  ["CommissionApprovedEmail", () => CommissionApprovedEmail({ influencerName: "Kasia", productName: "Koszulka", commissionAmount: 29.99, availableBalance: 149.5 })],
  ["CommissionPendingBrandEmail", () => CommissionPendingBrandEmail({ brandName: "TechStore", influencerName: "Kasia", productName: "Koszulka", orderValue: 199.99, commissionAmount: 29.99, orderId: "ORD-1" })],
  ["PayoutApprovedEmail", () => PayoutApprovedEmail({ influencerName: "Kasia", amount: 250, bankAccount: "PL61109010140000071219812874", preferredPayout: "bank" })],
  ["PayoutCompletedEmail", () => PayoutCompletedEmail({ influencerName: "Kasia", amount: 250, referenceNumber: "REF-1" })],
  ["InvoiceEmail", () => InvoiceEmail({ brandName: "TechStore", invoiceNumber: "FV/2026/01", grossAmount: 1230, dueDate: "01.03.2026", periodFrom: "01.02.2026", periodTo: "28.02.2026", invoiceUrl: "https://www.deneeu.pl/api/invoices/x/pdf", bankAccount: "PL61 1090 1014 0000 0712 1981 2874", issuerName: "Deneeu Sp. z o.o." })],
  ["AdminTransferFailedEmail", () => AdminTransferFailedEmail({ influencerName: "Kasia", amount: 250, transferId: "tr_123" })],
];

/**
 * Pola opcjonalne pominięte — tu najłatwiej o "undefined" w treści maila.
 * Wypłata bez numeru referencyjnego czy bez konta bankowego (PayPal) to
 * normalne przypadki produkcyjne, nie sytuacje wyjątkowe.
 */
const Z_POMINIETYMI: Przypadek[] = [
  ["PayoutApprovedEmail bez konta", () => PayoutApprovedEmail({ influencerName: "Kasia", amount: 250 })],
  ["PayoutApprovedEmail przez PayPal", () => PayoutApprovedEmail({ influencerName: "Kasia", amount: 250, paypalEmail: "kasia@paypal.com", preferredPayout: "paypal" })],
  ["PayoutCompletedEmail bez referencji", () => PayoutCompletedEmail({ influencerName: "Kasia", amount: 250 })],
  ["CommissionPendingBrandEmail bez orderId", () => CommissionPendingBrandEmail({ brandName: "TechStore", influencerName: "Kasia", productName: "Koszulka", orderValue: 199.99, commissionAmount: 29.99 })],
];

const WSZYSTKIE = [...KOMPLETNE, ...Z_POMINIETYMI];

async function tekstMaila(el: React.ReactElement) {
  const html = await render(el);
  return { html, tekst: html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ") };
}

describe("szablony maili", () => {
  for (const [nazwa, buduj] of WSZYSTKIE) {
    it(`${nazwa} — renderuje się bez wyjątku`, async () => {
      const { html } = await tekstMaila(buduj());
      expect(html).toContain("<html");
      expect(html.length).toBeGreaterThan(300);
    });

    it(`${nazwa} — nie przecieka undefined/NaN do treści`, async () => {
      const { tekst } = await tekstMaila(buduj());
      expect(tekst).not.toMatch(/\bundefined\b/);
      expect(tekst).not.toMatch(/\bNaN\b/);
      expect(tekst).not.toMatch(/\[object Object\]/);
    });
  }

  it("linki prowadzą na kanoniczną domenę z www", async () => {
    for (const [nazwa, buduj] of KOMPLETNE) {
      const { html } = await tekstMaila(buduj());
      const linki = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
      for (const l of linki) {
        expect(l, `${nazwa}: ${l}`).not.toMatch(/^https:\/\/deneeu\.pl/);
      }
    }
  });

  it("każdy mail ma tekst podglądu (preview) dla listy wiadomości", async () => {
    for (const [nazwa, buduj] of KOMPLETNE) {
      const { html } = await tekstMaila(buduj());
      // react-email renderuje Preview jako ukryty div na początku body
      expect(html, nazwa).toMatch(/display:\s*none/i);
    }
  });
});

/**
 * Wersja tekstowa jest generowana z tego samego elementu co HTML (patrz
 * sendEmail w src/lib/resend.ts). Te testy pilnują, że jest użyteczna —
 * pusta albo pozbawiona linku byłaby gorsza niż jej brak, bo dawałaby
 * złudzenie, że problem dostarczalności jest rozwiązany.
 */
describe("wersja tekstowa maili", () => {
  for (const [nazwa, buduj] of KOMPLETNE) {
    it(`${nazwa} — ma sensowną treść tekstową`, async () => {
      const text = await render(buduj(), { plainText: true });
      expect(text.trim().length, nazwa).toBeGreaterThan(60);
      expect(text).not.toMatch(/\bundefined\b/);
      expect(text).not.toMatch(/\bNaN\b/);
      expect(text).not.toContain("<");
    });
  }

  it("maile z linkiem akcji zachowują go w wersji tekstowej", async () => {
    const zLinkiem: Przypadek[] = KOMPLETNE.filter(([n]) =>
      ["VerifyEmailEmail", "PasswordResetEmail", "InvoiceEmail"].includes(n),
    );
    expect(zLinkiem.length).toBe(3);
    for (const [nazwa, buduj] of zLinkiem) {
      const text = await render(buduj(), { plainText: true });
      expect(text, nazwa).toMatch(/https:\/\/www\.deneeu\.pl/);
    }
  });
});

/**
 * Dane do przelewu w mailu muszą zgadzać się z fakturą PDF. Wcześniej odbiorca
 * był tu zaszyty na sztywno, a tytuł przelewu to był sam numer faktury —
 * marka dostawała dwa różne polecenia dla jednego przelewu.
 */
describe("InvoiceEmail — dane do przelewu", () => {
  const dane = {
    brandName: "Żółć Śląska",
    invoiceNumber: "FV/2026/02/0001",
    grossAmount: 1230,
    dueDate: "15.02.2026",
    periodFrom: "01.01.2026",
    periodTo: "31.01.2026",
    invoiceUrl: "https://www.deneeu.pl/api/invoices/x/pdf",
    bankAccount: "PL61 1090 1014 0000 0712 1981 2874",
    issuerName: "Deneeu Sp. z o.o.",
  };

  it("tytuł przelewu składa numer faktury z nazwą marki — tak jak PDF", async () => {
    const html = await render(InvoiceEmail(dane));
    expect(html).toContain("Faktura FV/2026/02/0001 / Żółć Śląska");
  });

  it("odbiorca pochodzi z faktury, nie jest zaszyty w szablonie", async () => {
    const html = await render(InvoiceEmail({ ...dane, issuerName: "Inna Firma S.A." }));
    expect(html).toContain("Inna Firma S.A.");
    expect(html).not.toContain("Deneeu Sp. z o.o.");
  });

  it("podaje numer konta i kwotę", async () => {
    const html = await render(InvoiceEmail(dane));
    expect(html).toContain("PL61 1090 1014 0000 0712 1981 2874");
    expect(html).toContain("15.02.2026");
  });

  it("mówi wprost, że wypłaty odblokowują się po wpłacie", async () => {
    const html = await render(InvoiceEmail(dane));
    expect(html).toMatch(/odblokowane po zaksięgowaniu/i);
  });
});
