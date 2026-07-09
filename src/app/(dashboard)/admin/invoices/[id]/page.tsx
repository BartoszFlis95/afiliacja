import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, CheckCircle, XCircle } from "lucide-react";

import { auth } from "@/lib/auth";
import { getInvoiceAction, updateInvoiceStatusAction } from "@/actions/invoice.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InvoiceItem } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  DRAFT:     { label: "Szkic",     variant: "secondary" },
  ISSUED:    { label: "Wystawiona", variant: "default" },
  PAID:      { label: "Opłacona",  variant: "success" },
  CANCELLED: { label: "Anulowana", variant: "destructive" },
};

const formatPLN = (v: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);

const formatDate = (d: Date | string) =>
  new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(new Date(d));

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const result = await getInvoiceAction(id);

  if (!result.success) notFound();

  const invoice = result.data!;
  const badge = STATUS_BADGE[invoice.status] ?? STATUS_BADGE.ISSUED;
  const items = invoice.items as InvoiceItem[];

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/invoices">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Faktury
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-foreground font-mono">
            {invoice.invoiceNumber}
          </h1>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/invoices/${invoice.id}/pdf`} download>
              <Download className="mr-1 h-4 w-4" />
              Pobierz PDF
            </a>
          </Button>

          {invoice.status === "ISSUED" && (
            <form action={async () => {
              "use server";
              await updateInvoiceStatusAction(invoice.id, "PAID" as const);
            }}>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle className="mr-1 h-4 w-4" />
                Oznacz jako opłaconą
              </Button>
            </form>
          )}

          {(invoice.status === "DRAFT" || invoice.status === "ISSUED") && (
            <form action={async () => {
              "use server";
              await updateInvoiceStatusAction(invoice.id, "CANCELLED" as const);
            }}>
              <Button type="submit" size="sm" variant="destructive">
                <XCircle className="mr-1 h-4 w-4" />
                Anuluj
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Invoice preview */}
      <div className="max-w-3xl mx-auto print:max-w-none">
        <Card className="overflow-hidden print:shadow-none">
          <CardContent className="p-8 space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900">FAKTURA VAT</h2>
              <p className="text-lg text-slate-600 font-mono mt-1">Nr: {invoice.invoiceNumber}</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Data wystawienia</p>
                <p className="font-medium">{formatDate(invoice.issuedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Termin płatności</p>
                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Okres rozliczeniowy</p>
                <p className="font-medium">
                  {new Intl.DateTimeFormat("pl-PL", { dateStyle: "short" }).format(new Date(invoice.periodFrom))} –{" "}
                  {new Intl.DateTimeFormat("pl-PL", { dateStyle: "short" }).format(new Date(invoice.periodTo))}
                </p>
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* Parties */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sprzedawca</p>
                <p className="font-semibold text-slate-900">{invoice.issuerName}</p>
                <p className="text-muted-foreground">NIP: {invoice.issuerNip}</p>
                <p className="text-muted-foreground">{invoice.issuerAddress}</p>
                <p className="text-muted-foreground">{invoice.issuerPostalCode} {invoice.issuerCity}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Nabywca</p>
                <p className="font-semibold text-slate-900">{invoice.brandCompanyName}</p>
                {invoice.brandNip && <p className="text-muted-foreground">NIP: {invoice.brandNip}</p>}
                {invoice.brandAddress && <p className="text-muted-foreground">{invoice.brandAddress}</p>}
                {(invoice.brandPostalCode || invoice.brandCity) && (
                  <p className="text-muted-foreground">{invoice.brandPostalCode} {invoice.brandCity}</p>
                )}
                <p className="text-muted-foreground">{invoice.brandEmail}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pozycje</p>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                <Table className="min-w-[520px]">
                  <TableHeader>
                    <TableRow className="bg-slate-900 hover:bg-slate-900">
                      <TableHead className="pl-4 text-white">Opis</TableHead>
                      <TableHead className="text-right text-white">Ilość</TableHead>
                      <TableHead className="text-right text-white">Cena jedn.</TableHead>
                      <TableHead className="pr-4 text-right text-white">Wartość</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-4">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatPLN(item.unitPrice)}</TableCell>
                        <TableCell className="pr-4 text-right font-medium">{formatPLN(item.totalPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </Card>
            </div>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Razem netto</span>
                  <span>{formatPLN(invoice.netAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT {invoice.vatRate}%</span>
                  <span>{formatPLN(invoice.vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-2">
                  <span>Do zapłaty (brutto)</span>
                  <span>{formatPLN(invoice.grossAmount)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">
              <p>Forma płatności: przelew bankowy</p>
              <p>Termin płatności: {formatDate(invoice.dueDate)}</p>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="rounded-lg border border-slate-200 p-4 text-sm">
                <p className="font-medium text-slate-700 mb-1">Uwagi</p>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
