"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Receipt } from "lucide-react";
import { toast } from "sonner";

import {
  generateMonthlyInvoiceAction,
  markInvoicePaidAction,
  type PozycjaRozliczenia,
} from "@/actions/invoice.actions";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/lib/utils";
import { nazwaMiesiaca } from "@/lib/rozliczenia";

const MIESIACE = Array.from({ length: 12 }, (_, i) => i + 1);

function Status({ pozycja }: { pozycja: PozycjaRozliczenia }) {
  if (!pozycja.invoice) {
    return (
      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Do zafakturowania
      </span>
    );
  }
  if (pozycja.invoice.status === "PAID") {
    return (
      <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        Opłacona — wypłaty odblokowane
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
      Wystawiona — czeka na wpłatę
    </span>
  );
}

export function AdminBillingClient({
  pozycje,
  month,
  year,
}: {
  pozycje: PozycjaRozliczenia[];
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [pracuje, setPracuje] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const lata = [year - 1, year, year + 1];

  function zmienOkres(m: number, r: number) {
    router.push(`/admin/billing?month=${m}&year=${r}`);
  }

  function generuj(pozycja: PozycjaRozliczenia) {
    setPracuje(pozycja.brandId);
    startTransition(async () => {
      const wynik = await generateMonthlyInvoiceAction(pozycja.brandId, month, year);
      setPracuje(null);
      if (!wynik.success) {
        toast.error(wynik.error);
        return;
      }
      toast.success(`Wystawiono fakturę ${wynik.data?.invoiceNumber}`);
      router.refresh();
    });
  }

  function oznaczOplacone(pozycja: PozycjaRozliczenia) {
    if (!pozycja.invoice) return;
    setPracuje(pozycja.brandId);
    startTransition(async () => {
      const wynik = await markInvoicePaidAction(pozycja.invoice!.id);
      setPracuje(null);
      if (!wynik.success) {
        toast.error(wynik.error);
        return;
      }
      toast.success("Wpłata zaksięgowana — wypłaty influencerów odblokowane");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="miesiac" className="text-sm text-muted-foreground">
          Okres
        </label>
        <select
          id="miesiac"
          value={month}
          onChange={(e) => zmienOkres(Number(e.target.value), year)}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground"
        >
          {MIESIACE.map((m) => (
            <option key={m} value={m}>
              {nazwaMiesiaca(m)}
            </option>
          ))}
        </select>
        <select
          aria-label="Rok"
          value={year}
          onChange={(e) => zmienOkres(month, Number(e.target.value))}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground"
        >
          {lata.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {pozycje.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Brak rozliczeń w tym okresie"
          description={`Za ${nazwaMiesiaca(month)} ${year} nie ma zatwierdzonych prowizji ani wystawionych faktur.`}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marka</TableHead>
                    <TableHead className="text-right">Prowizje</TableHead>
                    <TableHead className="text-right">Opłata</TableHead>
                    <TableHead className="text-right">Razem brutto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcja</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pozycje.map((p) => (
                    <TableRow key={p.brandId}>
                      <TableCell>
                        <span className="font-medium text-foreground">{p.companyName}</span>
                        {!p.nip && (
                          <span className="mt-0.5 block text-xs text-destructive">
                            brak NIP — nie da się wystawić faktury
                          </span>
                        )}
                        {p.invoice && (
                          <Link
                            href={`/admin/invoices/${p.invoice.id}`}
                            className="mt-0.5 block text-xs text-primary hover:underline"
                          >
                            {p.invoice.invoiceNumber}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.prowizje)}
                        {p.liczbaProwizji > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({p.liczbaProwizji})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatCurrency(p.oplata)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-foreground">
                        {formatCurrency(p.invoice ? p.invoice.grossAmount : p.brutto)}
                      </TableCell>
                      <TableCell>
                        <Status pozycja={p} />
                      </TableCell>
                      <TableCell className="text-right">
                        {!p.invoice ? (
                          <Button
                            size="sm"
                            disabled={!p.nip || p.liczbaProwizji === 0 || pracuje === p.brandId}
                            loading={pracuje === p.brandId}
                            onClick={() => generuj(p)}
                          >
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            Generuj fakturę
                          </Button>
                        ) : p.invoice.status !== "PAID" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pracuje === p.brandId}
                            loading={pracuje === p.brandId}
                            onClick={() => oznaczOplacone(p)}
                          >
                            Oznacz jako zapłacone
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
