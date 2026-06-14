import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getInfluencerCommissionsAction } from "@/actions/commission.actions";
import { PayoutModal } from "@/components/influencer/PayoutModal";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const statusBadge: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Oczekuje", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Zatwierdzona", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Odrzucona", className: "bg-red-100 text-red-800" },
  PAID: { label: "Wypłacona", className: "bg-blue-100 text-blue-800" },
};

const formatPLN = (value: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(
    value
  );

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(date);

export default async function InfluencerCommissionsPage() {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const result = await getInfluencerCommissionsAction();
  const commissions = result.success ? result.data : [];

  // Saldo dostępne: suma commissionAmount wszystkich zatwierdzonych prowizji.
  const availableBalance = commissions
    .filter((c) => c.status === "APPROVED")
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Moje prowizje
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Śledź zarobki i zlecaj wypłaty zatwierdzonych prowizji.
        </p>
      </header>

      <Card className="max-w-xs border-zinc-200 bg-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-zinc-500">Saldo dostępne do wypłaty</p>
              <p className="text-2xl font-bold text-zinc-900">
                {formatPLN(availableBalance)}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
              <Wallet className="h-5 w-5 text-zinc-900" />
            </span>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Suma zatwierdzonych prowizji
          </p>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produkt</TableHead>
              <TableHead>Marka</TableHead>
              <TableHead className="text-right">Wartość zamówienia</TableHead>
              <TableHead className="text-right">Prowizja</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-zinc-500"
                >
                  Brak prowizji do wyświetlenia.
                </TableCell>
              </TableRow>
            ) : (
              commissions.map((commission) => {
                const badge =
                  statusBadge[commission.status] ?? statusBadge.PENDING;
                return (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium text-zinc-900">
                      {commission.product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-zinc-700">
                      {commission.brand?.companyName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-zinc-700">
                      {formatPLN(Number(commission.orderValue))}
                    </TableCell>
                    <TableCell className="text-right font-medium text-zinc-900">
                      {formatPLN(Number(commission.commissionAmount))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(commission.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
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
      </div>
    </div>
  );
}
