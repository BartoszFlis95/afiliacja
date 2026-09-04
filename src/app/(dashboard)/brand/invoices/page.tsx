export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Download, Receipt } from "lucide-react";

import { auth } from "@/lib/auth";
import { getMyBrandInvoicesAction } from "@/actions/invoice.actions";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DaneDoPrzelewu } from "@/components/brand/DaneDoPrzelewu";

// Opis zamiast jednego słowa: „Opłacona” nie mówi marce, co się przez to
// stało, a najważniejszy skutek wpłaty to odblokowanie wypłat influencerów.
const ETYKIETY: Record<string, { tekst: string; klasa: string }> = {
  DRAFT: { tekst: "Szkic", klasa: "border-border text-muted-foreground" },
  ISSUED: {
    tekst: "⏳ Oczekuje na płatność",
    klasa: "border-warning/30 bg-warning/10 text-warning",
  },
  PAID: {
    tekst: "✅ Opłacona — wypłaty odblokowane",
    klasa: "border-success/30 bg-success/10 text-success",
  },
  CANCELLED: { tekst: "Anulowana", klasa: "border-border text-muted-foreground" },
};

export default async function BrandInvoicesPage() {
  const session = await auth();
  if (session?.user?.role !== "BRAND") redirect("/login");

  const wynik = await getMyBrandInvoicesAction();
  const faktury = wynik.success ? (wynik.data ?? []) : [];

  // Numer konta czytamy na serwerze — zmienna bez prefiksu NEXT_PUBLIC_ nie
  // dociera do przeglądarki, więc w komponencie klienckim byłaby pusta.
  const numerKonta = process.env.DENEEU_BANK_ACCOUNT ?? "— nie skonfigurowano";

  // Baner pokazujemy dla najstarszej nieopłaconej: to ona ma najbliższy termin
  // i to nią marka powinna zająć się najpierw.
  const doZaplaty = faktury
    .filter((f) => f.status === "ISSUED")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Faktury</h1>
        <p className="mt-1 text-muted-foreground">
          {faktury.length.toLocaleString("pl-PL")} faktur za rozliczenia miesięczne.
          Opłacenie faktury odblokowuje wypłaty influencerów z danego okresu.
        </p>
      </header>

      {doZaplaty && (
        <DaneDoPrzelewu
          invoiceNumber={doZaplaty.invoiceNumber}
          brandCompanyName={doZaplaty.brandCompanyName}
          issuerName={doZaplaty.issuerName}
          grossAmount={doZaplaty.grossAmount}
          dueDate={doZaplaty.dueDate}
          numerKonta={numerKonta}
          poTerminie={doZaplaty.dniPoTerminie > 0}
        />
      )}

      {!wynik.success ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {wynik.error}
        </p>
      ) : faktury.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Brak faktur"
          description="Pierwsza faktura zostanie wystawiona po zakończeniu miesiąca, w którym pojawią się zatwierdzone prowizje."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numer</TableHead>
                    <TableHead>Okres</TableHead>
                    <TableHead className="text-right">Kwota brutto</TableHead>
                    <TableHead>Termin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faktury.map((f) => {
                    const etykieta = ETYKIETY[f.status] ?? ETYKIETY.DRAFT;
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium text-foreground">
                          {f.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(new Date(f.periodFrom))} – {formatDate(new Date(f.periodTo))}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-foreground">
                          {formatCurrency(f.grossAmount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(new Date(f.dueDate))}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${etykieta.klasa}`}
                          >
                            {etykieta.tekst}
                          </span>
                          {f.paidAt && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {formatDate(new Date(f.paidAt))}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={`/api/invoices/${f.id}/pdf`}
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Pobierz
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
