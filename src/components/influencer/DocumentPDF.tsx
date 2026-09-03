import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { registerPdfFonts } from "@/lib/pdf-fonts";

registerPdfFonts();

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
  docNumber: {
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
  colDesc: { flex: 3 },
  colTotal: { flex: 1, textAlign: "right" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    padding: "4 8",
  },
  summaryGrossLabel: {
    width: 120,
    textAlign: "right",
    fontFamily: "Roboto", fontWeight: "bold",
    color: "#18181b",
    marginRight: 8,
  },
  summaryGrossValue: {
    width: 90,
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

interface DocumentData {
  number: string;
  issuedAt: Date | string;
  sellerName: string;
  sellerCity?: string | null;
  sellerCountry?: string | null;
  sellerEmail: string;
  productName: string | null;
  netAmount: number;
  bankAccountIban?: string | null;
}

export function DocumentPDF({ document: doc }: { document: DocumentData }) {
  return (
    <Document title={`Rachunek ${doc.number}`} author="Deneeu">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>RACHUNEK</Text>
        <Text style={styles.docNumber}>Nr: {doc.number}</Text>

        <View style={{ marginBottom: 16 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Data wystawienia:</Text>
            <Text style={styles.value}>{formatDate(doc.issuedAt)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Sprzedawca</Text>
            <Text style={styles.partyName}>{doc.sellerName}</Text>
            {(doc.sellerCity || doc.sellerCountry) && (
              <Text style={styles.partyDetail}>
                {[doc.sellerCity, doc.sellerCountry].filter(Boolean).join(", ")}
              </Text>
            )}
            <Text style={styles.partyDetail}>{doc.sellerEmail}</Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Nabywca</Text>
            <Text style={styles.partyName}>Deneeu Sp. z o.o.</Text>
            <Text style={styles.partyDetail}>ul. Przykładowa 1</Text>
            <Text style={styles.partyDetail}>00-001 Warszawa</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pozycje</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colDesc]}>Opis</Text>
          <Text style={[styles.tableHeaderCell, styles.colTotal]}>Wartość</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colDesc}>
            Prowizja afiliacyjna{doc.productName ? ` – ${doc.productName}` : ""}
          </Text>
          <Text style={styles.colTotal}>{formatPLN(doc.netAmount)}</Text>
        </View>

        <View style={{ marginTop: 8 }}>
          <View
            style={[
              styles.summaryRow,
              { borderTopWidth: 1, borderTopColor: "#18181b", marginTop: 4, paddingTop: 8 },
            ]}
          >
            <Text style={styles.summaryGrossLabel}>Kwota netto:</Text>
            <Text style={styles.summaryGrossValue}>{formatPLN(doc.netAmount)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Forma płatności: przelew bankowy</Text>
          {doc.bankAccountIban && (
            <Text style={styles.footerText}>Nr rachunku: {doc.bankAccountIban}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
