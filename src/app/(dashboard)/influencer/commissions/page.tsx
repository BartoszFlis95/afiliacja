import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getInfluencerCommissionsAction } from "@/actions/commission.actions";
import { PayoutModal } from "@/components/influencer/PayoutModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const STATUS_BADGE: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "default" }> = {
  PENDING:  { label: "Oczekuje",     variant: "warning" },
  APPROVED: { label: "Zatwierdzona", variant: "success" },
  REJECTED: { label: "Odrzucona",    variant: "destructive" },
  PAID:     { label: "Wypłacona",    variant: "default" },
};

const formatPLN = (value: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(date);

export default async function InfluencerCommissionsPage() {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const result = await getInfluencerCommissionsAction();
  const commissions = result.success ? result.data : [];

  const availableBalance = commissions
    .filter((c) => c.status === "APPROVED")
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Moje prowizje</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Śledź zarobki i zlecaj wypłaty zatwierdzonych prowizji.
        </p>
      </header>

      {/* Balance card */}
      <Card className="max-w-xs">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saldo dostępne do wypłaty</p>
              <p className="text-2xl font-semibold text-foreground">
                {formatPLN(availableBalance)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Suma zatwierdzonych prowizji</p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Produkt</TableHead>
              <TableHead>Marka</TableHead>
              <TableHead className="text-right">Wartość</TableHead>
              <TableHead className="text-right">Prowizja</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="pr-6 text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Brak prowizji do wyświetlenia
                </TableCell>
              </TableRow>
            ) : (
              commissions.map((commission) => {
                const badge = STATUS_BADGE[commission.status] ?? STATUS_BADGE.PENDING;
                return (
                  <TableRow key={commission.id}>
                    <TableCell className="pl-6 font-medium">
                      {commission.product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {commission.brand?.companyName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatPLN(Number(commission.orderValue))}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {formatPLN(Number(commission.commissionAmount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(commission.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {commission.status === "APPROVED" ? (
                        <PayoutModal
                          commissionId={commission.id}
                          amount={Number(commission.commissionAmount)}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
