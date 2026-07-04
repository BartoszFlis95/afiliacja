import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceItem } from "@/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#3f3f46",
    padding: 48,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
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
    fontFamily: "Helvetica-Bold",
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
    fontFamily: "Helvetica-Bold",
    color: "#71717a",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
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
    fontFamily: "Helvetica-Bold",
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
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    marginRight: 8,
  },
  summaryGrossValue: {
    width: 80,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
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
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  items: InvoiceItem[];
  notes?: string | null;
}

export function InvoicePDF({ invoice }: { invoice: InvoiceData }) {
  return (
    <Document title={`Faktura ${invoice.invoiceNumber}`} author="Deneeu">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>FAKTURA VAT</Text>
        <Text style={styles.invoiceNumber}>Nr: {invoice.invoiceNumber}</Text>

        {/* Dates */}
        <View style={{ marginBottom: 16 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Data wystawienia:</Text>
            <Text style={styles.value}>{formatDate(invoice.issuedAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Termin płatności:</Text>
            <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Okres rozliczeniowy:</Text>
            <Text style={styles.value}>
              {formatDate(invoice.periodFrom)} – {formatDate(invoice.periodTo)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Parties */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Sprzedawca</Text>
            <Text style={styles.partyName}>{invoice.issuerName}</Text>
            <Text style={styles.partyDetail}>NIP: {invoice.issuerNip}</Text>
            <Text style={styles.partyDetail}>{invoice.issuerAddress}</Text>
            <Text style={styles.partyDetail}>
              {invoice.issuerPostalCode} {invoice.issuerCity}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Nabywca</Text>
            <Text style={styles.partyName}>{invoice.brandCompanyName}</Text>
            {invoice.brandNip && (
              <Text style={styles.partyDetail}>NIP: {invoice.brandNip}</Text>
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
        <Text style={styles.sectionTitle}>Pozycje faktury</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colDesc]}>Opis</Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Ilość</Text>
          <Text style={[styles.tableHeaderCell, styles.colUnit]}>Cena jedn.</Text>
          <Text style={[styles.tableHeaderCell, styles.colTotal]}>Wartość</Text>
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
            <Text style={styles.summaryLabel}>Razem netto:</Text>
            <Text style={styles.summaryValue}>{formatPLN(invoice.netAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>VAT {invoice.vatRate}%:</Text>
            <Text style={styles.summaryValue}>{formatPLN(invoice.vatAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: "#18181b", marginTop: 4, paddingTop: 8 }]}>
            <Text style={styles.summaryGrossLabel}>Do zapłaty (brutto):</Text>
            <Text style={styles.summaryGrossValue}>{formatPLN(invoice.grossAmount)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Payment info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Forma płatności: przelew bankowy</Text>
          <Text style={styles.footerText}>
            Termin płatności: {formatDate(invoice.dueDate)}
          </Text>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={[styles.label, { marginBottom: 4 }]}>Uwagi:</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
