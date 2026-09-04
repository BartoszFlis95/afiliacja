import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { describe, expect, it } from "vitest";

import { InvoicePDF } from "@/components/admin/InvoicePDF";
import { DocumentPDF } from "@/components/influencer/DocumentPDF";

const FAKTURA = {
  invoiceNumber: "FV/2026/02/0001",
  issuedAt: new Date("2026-02-01"), dueDate: new Date("2026-02-15"),
  periodFrom: new Date("2026-01-01"), periodTo: new Date("2026-01-31"),
  netAmount: 1000, vatRate: 23, vatAmount: 230, grossAmount: 1230,
  brandCompanyName: "Żółć Śląska Sp. z o.o.", brandNip: "1234567890",
  brandAddress: "ul. Świętokrzyska 12", brandCity: "Gdańsk", brandPostalCode: "80-001",
  brandEmail: "ksiegowosc@zolc.pl",
  issuerName: "Deneeu Sp. z o.o.", issuerNip: "5252445719",
  issuerAddress: "ul. Prosta 51", issuerCity: "Warszawa", issuerPostalCode: "00-838",
  status: "ISSUED", notes: "Zapłać w terminie — dziękujemy!",
  bankAccount: "PL61 1090 1014 0000 0712 1981 2874",
  items: [
    { description: "Prowizje afiliacyjne – Koszulka bawełniana", quantity: 3, unitPrice: 200, totalPrice: 600 },
  ],
} as never;

const DOKUMENT = {
  number: "RC/2026/0001",
  issuedAt: new Date("2026-02-01"),
  sellerName: "Łukasz Wiśniewski", sellerCity: "Gdańsk", sellerCountry: "Polska",
  sellerEmail: "lukasz@example.pl",
  productName: "Koszulka bawełniana", netAmount: 250,
  bankAccountIban: "PL61109010140000071219812874",
} as never;

/**
 * Oba dokumenty używały fontFamily "Helvetica" — jednego z czternastu fontów
 * wbudowanych w standard PDF, z kodowaniem WinAnsi, które nie zawiera polskich
 * znaków. Na fakturze wychodziło "1000,00 zB" zamiast "1000,00 zł", "Ilo["
 * zamiast "Ilość", "GdaDsk" zamiast "Gdańsk".
 *
 * Test pilnuje, że font jest OSADZONY w pliku. Powrót do wbudowanego fontu
 * albo usunięcie registerPdfFonts() natychmiast go wywali.
 */
const PRZYPADKI: Array<[string, () => React.ReactElement]> = [
  ["InvoicePDF", () => React.createElement(InvoicePDF, { invoice: FAKTURA }) as never],
  ["DocumentPDF", () => React.createElement(DocumentPDF, { document: DOKUMENT }) as never],
];

describe("dokumenty PDF", () => {
  for (const [nazwa, buduj] of PRZYPADKI) {
    it(`${nazwa} — generuje poprawny plik PDF`, async () => {
      const buf = await renderToBuffer(buduj() as never);
      expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
      expect(buf.length).toBeGreaterThan(5000);
    });

    it(`${nazwa} — osadza font (polskie znaki nie mogą się rozjechać)`, async () => {
      const buf = await renderToBuffer(buduj() as never);
      const raw = buf.toString("latin1");
      expect(/FontFile2|FontFile3/.test(raw), `${nazwa}: brak osadzonego fontu`).toBe(true);
      expect(/BaseFont\s*\/Helvetica/.test(raw), `${nazwa}: użyto wbudowanej Helvetiki`).toBe(false);
    });

    it(`${nazwa} — osadzony font ma wariant pogrubiony`, async () => {
      const buf = await renderToBuffer(buduj() as never);
      const raw = buf.toString("latin1");
      // dwa różne deskryptory fontu = Regular + Bold
      const deskryptory = (raw.match(/\/FontFile2/g) ?? []).length;
      expect(deskryptory, `${nazwa}: oczekiwano dwóch osadzonych krojów`).toBeGreaterThanOrEqual(2);
    });
  }
});

/**
 * Sekcja "Dane do przelewu" jest jedynym miejscem, z którego marka odczytuje,
 * dokąd i z jakim tytułem ma zapłacić. Testy wyżej sprawdzają tylko poprawność
 * pliku i osadzenie fontu — przeszłyby także wtedy, gdyby tej sekcji w ogóle
 * nie było, więc jej obecność wymaga osobnej asercji.
 */
describe("InvoicePDF — dane do przelewu", () => {
  it("dokument urósł po dodaniu sekcji przelewu", async () => {
    const zSekcja = await renderToBuffer(InvoicePDF({ invoice: FAKTURA }) as never);
    const bezKonta = await renderToBuffer(
      InvoicePDF({ invoice: { ...(FAKTURA as object), bankAccount: "" } as never }) as never,
    );
    // ta sama faktura bez numeru konta rysuje mniej tekstu
    expect(zSekcja.length).toBeGreaterThan(bezKonta.length);
  });

  it("renderuje się z polskimi znakami w nazwie marki w tytule przelewu", async () => {
    // tytuł przelewu skleja numer faktury z nazwą marki ("Żółć Śląska"),
    // więc trafiają tam diakrytyki — a to one rozjeżdżały się na foncie WinAnsi
    const buf = await renderToBuffer(InvoicePDF({ invoice: FAKTURA }) as never);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(/FontFile2|FontFile3/.test(buf.toString("latin1"))).toBe(true);
  });

  it("brak skonfigurowanego konta nie wywala generowania faktury", async () => {
    const buf = await renderToBuffer(
      InvoicePDF({ invoice: { ...(FAKTURA as object), bankAccount: "—" } as never }) as never,
    );
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
