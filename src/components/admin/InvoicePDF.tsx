import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { registerPdfFonts } from "@/lib/pdf-fonts";

registerPdfFonts();
import type { InvoiceItem } from "@/types";
import { NOTA_KLEINUNTERNEHMER, wystawcaZNiemiec } from "@/lib/site";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#3f3f46",
    padding: 48,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontFamily: "Roboto", fontWeight: "bold",
    color: "#18181b",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#18181b",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  label: {
    color: "#71717a",
    width: 140,
  },
  value: {
    color: "#18181b",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Roboto", fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 20,
  },
  partyBox: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f4f4f5",
    borderRadius: 4,
  },
  partyTitle: {
    fontSize: 9,
    fontFamily: "Roboto", fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Roboto", fontWeight: "bold",
    color: "#18181b",
    marginBottom: 4,
  },
  partyDetail: {
    color: "#52525b",
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#18181b",
    padding: "6 8",
    borderRadius: 4,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontFamily: "Roboto", fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: "6 8",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    padding: "4 8",
  },
  summaryLabel: {
    width: 100,
    textAlign: "right",
    color: "#71717a",
    marginRight: 8,
  },
  summaryValue: {
    width: 80,
    textAlign: "right",
    color: "#18181b",
  },
  summaryGrossLabel: {
    width: 100,
    textAlign: "right",
    fontFamily: "Roboto", fontWeight: "bold",
    color: "#18181b",
    marginRight: 8,
  },
  summaryGrossValue: {
    width: 80,
    textAlign: "right",
    fontFamily: "Roboto", fontWeight: "bold",
    color: "#18181b",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    marginVertical: 16,
  },
  footer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#f4f4f5",
    borderRadius: 4,
  },
  footerText: {
    color: "#71717a",
    fontSize: 9,
    marginBottom: 2,
  },
  paymentBox: {
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 3,
  },
  paymentTitle: {
    fontSize: 10,
    fontFamily: "Roboto",
    fontWeight: "bold",
    marginBottom: 7,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  paymentLabel: {
    width: 110,
    fontSize: 9,
    color: "#52525b",
  },
  paymentValue: {
    fontSize: 9,
    flex: 1,
  },
  paymentValueStrong: {
    fontSize: 10,
    fontFamily: "Roboto",
    fontWeight: "bold",
    flex: 1,
  },
  legalBox: {
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#a1a1aa",
    borderRadius: 3,
  },
  legalText: {
    fontSize: 9,
    fontFamily: "Roboto",
    fontWeight: "bold",
  },
  legalTranslation: {
    fontSize: 8,
    color: "#52525b",
    marginTop: 2,
  },
  notesBox: {
    marginTop: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
  },
});

function formatPLN(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "short" }).format(new Date(date));
}

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date | string;
  dueDate: Date | string;
  periodFrom: Date | string;
  periodTo: Date | string;
  brandCompanyName: string;
  brandNip?: string | null;
  brandAddress?: string | null;
  brandCity?: string | null;
  brandPostalCode?: string | null;
  brandEmail: string;
  issuerName: string;
  issuerNip: string;
  issuerAddress: string;
  issuerCity: string;
  issuerPostalCode: string;
  bankAccount: string;
  /** Kraj i BIC — z konfiguracji, jak numer konta; patrz komentarz wyżej. */
  issuerCountry: string;
  issuerBic: string;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  items: InvoiceItem[];
  notes?: string | null;
}

/**
 * Numer konta podajemy z konfiguracji, a nie z migawki na fakturze — reszta
 * danych wystawcy jest zamrożona w chwili wystawienia (żeby dokument się nie
 * zmieniał), ale rachunek do wpłaty musi wskazywać konto AKTUALNE. Przedruk
 * starej, nieopłaconej faktury ma prowadzić tam, gdzie pieniądze mają trafić
 * dziś, a nie tam, gdzie miały trafić kiedyś.
 */

export function InvoicePDF({ invoice }: { invoice: InvoiceData }) {
  const zwolnionyZVat = Number(invoice.vatRate) === 0;
  // ten sam rozpoznawacz co w akcji generującej — inaczej etykieta na PDF
  // mogłaby mówić co innego niż reguła, która przepuściła fakturę bez NIP-u
  const niemieckiWystawca = wystawcaZNiemiec(invoice.issuerCountry ?? "");

  return (
    <Document title={`Faktura ${invoice.invoiceNumber}`} author="Deneeu">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>INVOICE · RECHNUNG</Text>
        <Text style={styles.invoiceNumber}>Nr: {invoice.invoiceNumber}</Text>

        {/* Dates */}
        <View style={{ marginBottom: 16 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Date · Datum</Text>
            <Text style={styles.value}>{formatDate(invoice.issuedAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Due date · Fälligkeit</Text>
            <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Period · Zeitraum</Text>
            <Text style={styles.value}>
              {formatDate(invoice.periodFrom)} – {formatDate(invoice.periodTo)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Parties */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Seller · Verkäufer</Text>
            <Text style={styles.partyName}>{invoice.issuerName}</Text>
            {/*
              Etykieta zależy od kraju wystawcy: Steuernummer w Niemczech,
              NIP w Polsce. Wartość to jedno i to samo pole — zmienia się
              nazwa, nie dane.
            */}
            <Text style={styles.partyDetail}>
              {niemieckiWystawca ? "Steuernummer" : "NIP"}: {invoice.issuerNip}
            </Text>
            <Text style={styles.partyDetail}>
              {invoice.issuerAddress}, {invoice.issuerPostalCode} {invoice.issuerCity}
              {invoice.issuerCountry ? `, ${invoice.issuerCountry}` : ""}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Buyer · Käufer</Text>
            <Text style={styles.partyName}>{invoice.brandCompanyName}</Text>
            {/*
              Przy wystawcy niemieckim numer nabywcy jest opcjonalny, a gdy jest
              — bywa numerem VAT UE albo krajowym, więc etykieta wymienia oba.
              Brak numeru nie wyświetla pustej sekcji: pusty wiersz „NIP:” na
              fakturze wygląda jak brak danych, a nie jak ich zbędność.
            */}
            {invoice.brandNip && (
              <Text style={styles.partyDetail}>
                {niemieckiWystawca ? "VAT ID / NIP" : "NIP"}: {invoice.brandNip}
              </Text>
            )}
            {invoice.brandAddress && (
              <Text style={styles.partyDetail}>{invoice.brandAddress}</Text>
            )}
            {(invoice.brandPostalCode || invoice.brandCity) && (
              <Text style={styles.partyDetail}>
                {invoice.brandPostalCode} {invoice.brandCity}
              </Text>
            )}
            <Text style={styles.partyDetail}>{invoice.brandEmail}</Text>
          </View>
        </View>

        {/* Items table */}
        <Text style={styles.sectionTitle}>Items · Positionen</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description · Beschreibung</Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty · Menge</Text>
          <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit price · Einzelpreis</Text>
          <Text style={[styles.tableHeaderCell, styles.colTotal]}>Amount · Betrag</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnit}>{formatPLN(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatPLN(item.totalPrice)}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={{ marginTop: 8 }}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net total · Nettobetrag</Text>
            <Text style={styles.summaryValue}>{formatPLN(invoice.netAmount)}</Text>
          </View>
          {/*
            Zwolnienie rozpoznajemy po stawce ZAPISANEJ NA FAKTURZE, nie po
            bieżącej konfiguracji. Dokument opisuje sam siebie: przedruk starej
            faktury z 23% pokaże 23%, choćby wystawca zmienił status później.
          */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {zwolnionyZVat ? "VAT 0% (Kleinunternehmer)" : `VAT ${invoice.vatRate}%`}
            </Text>
            <Text style={styles.summaryValue}>{formatPLN(invoice.vatAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: "#18181b", marginTop: 4, paddingTop: 8 }]}>
            <Text style={styles.summaryGrossLabel}>Total due · Gesamtbetrag</Text>
            <Text style={styles.summaryGrossValue}>{formatPLN(invoice.grossAmount)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Dane do przelewu */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Payment details · Zahlungsdaten</Text>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Beneficiary · Empfänger</Text>
            <Text style={styles.paymentValue}>{invoice.issuerName}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>IBAN</Text>
            <Text style={styles.paymentValueStrong}>{invoice.bankAccount}</Text>
          </View>

          {/*
            Tytuł przelewu z nazwą marki, nie samym numerem: przy ręcznym
            księgowaniu to po nim rozpoznaje się, od kogo przyszła wpłata,
            gdy nazwa nadawcy w banku różni się od nazwy firmy.
          */}
          {invoice.issuerBic && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>BIC / SWIFT</Text>
              <Text style={styles.paymentValueStrong}>{invoice.issuerBic}</Text>
            </View>
          )}

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Reference · Verwendungszweck</Text>
            <Text style={styles.paymentValueStrong}>
              Faktura {invoice.invoiceNumber} / {invoice.brandCompanyName}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount · Betrag</Text>
            <Text style={styles.paymentValueStrong}>{formatPLN(invoice.grossAmount)}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Due date · Fälligkeit</Text>
            <Text style={styles.paymentValue}>
              {formatDate(invoice.dueDate)} (7 dni od wystawienia)
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Method · Zahlungsart</Text>
            <Text style={styles.paymentValue}>przelew bankowy</Text>
          </View>
        </View>

        {/*
          Nota o zwolnieniu jest OBOWIĄZKOWA na fakturze małego przedsiębiorcy
          (§ 19 UStG). Bez wskazania podstawy zwolnienia dokument jest wadliwy
          i nabywca może go odrzucić — dlatego stoi osobno, nad uwagami, a nie
          w polu dowolnego tekstu, które admin mógłby nadpisać.
        */}
        {zwolnionyZVat && (
          <View style={styles.legalBox}>
            <Text style={styles.legalText}>{NOTA_KLEINUNTERNEHMER}</Text>
            <Text style={styles.legalTranslation}>
              Zgodnie z § 19 UStG podatek VAT nie jest naliczany.
            </Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={[styles.label, { marginBottom: 4 }]}>Notes · Anmerkungen</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
