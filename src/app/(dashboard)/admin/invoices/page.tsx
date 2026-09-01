import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

import { auth } from "@/lib/auth";
import { getInvoicesAction, getBrandsListAction } from "@/actions/invoice.actions";
import { GenerateInvoiceModal } from "@/components/admin/GenerateInvoiceModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  DRAFT:     { label: "Szkic",    variant: "secondary" },
  ISSUED:    { label: "Wystawiona", variant: "default" },
  PAID:      { label: "Opłacona",  variant: "success" },
  CANCELLED: { label: "Anulowana", variant: "destructive" },
};

const formatPLN = (v: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);

const formatDate = (d: Date | string) =>
  new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(d));

export default async function AdminInvoicesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const [invoicesResult, brandsResult] = await Promise.all([
    getInvoicesAction(),
    getBrandsListAction(),
  ]);

  const invoices = invoicesResult.success ? invoicesResult.data : [];
  const brands = brandsResult.success ? brandsResult.data : [];

  const totalGross = invoices.reduce((s, i) => s + i.grossAmount, 0);
  const issuedCount = invoices.filter((i) => i.status === "ISSUED").length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const issuedTotal = invoices.filter((i) => i.status === "ISSUED").reduce((s, i) => s + i.grossAmount, 0);

  const SUMMARY_CARDS = [
    { label: "Łącznie faktur", value: invoices.length.toString(), icon: FileText, color: "bg-primary/15 text-primary" },
    { label: "Łączna wartość brutto", value: formatPLN(totalGross), icon: TrendingUp, color: "bg-success/15 text-success" },
    { label: "Oczekujące na płatność", value: issuedCount.toString(), sub: formatPLN(issuedTotal), icon: Clock, color: "bg-warning/15 text-warning" },
    { label: "Opłacone", value: paidCount.toString(), icon: CheckCircle2, color: "bg-success/15 text-success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faktury</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Historia faktur VAT wystawianych dla marek.
          </p>
        </div>
        <GenerateInvoiceModal brands={brands} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Nr faktury</TableHead>
              <TableHead>Marka</TableHead>
              <TableHead>Okres</TableHead>
              <TableHead className="text-right">Brutto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data wystawienia</TableHead>
              <TableHead className="pr-6 text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={FileText}
                    title="Brak faktur"
                    description='Użyj przycisku „Wystaw fakturę", aby dodać pierwszą.'
                    className="border-0"
                  />
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                const badge = STATUS_BADGE[invoice.status] ?? STATUS_BADGE.ISSUED;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="pl-6 font-mono text-sm font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.brand.companyName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(invoice.periodFrom)} – {formatDate(invoice.periodTo)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPLN(invoice.grossAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.issuedAt)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/invoices/${invoice.id}`}>Podgląd</Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <a href={`/api/invoices/${invoice.id}/pdf`} download>
                            PDF
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
      </Card>
    </div>
  );
}
