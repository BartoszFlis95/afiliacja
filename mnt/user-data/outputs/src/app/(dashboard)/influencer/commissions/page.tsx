import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getInfluencerCommissionsAction } from "@/actions/commission.actions";
import { PayoutModal } from "@/components/influencer/PayoutModal";
import { StatsCard } from "@/components/shared/StatsCard";
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
    redirect("/dashboard");
  }

  const result = await getInfluencerCommissionsAction();
  const commissions = result.success ? result.data : [];

  // Available balance = APPROVED commissions that have no payout yet.
  const availableBalance = commissions
    .filter((c) => c.status === "APPROVED" && !c.payout)
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

      <div className="max-w-xs">
        <StatsCard
          title="Saldo dostępne"
          value={formatPLN(availableBalance)}
          description="Zatwierdzone prowizje bez wniosku o wypłatę"
          icon={Wallet}
        />
      </div>

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
                const canRequestPayout =
                  commission.status === "APPROVED" && !commission.payout;
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
                      {canRequestPayout ? (
                        <PayoutModal
                          commissionId={commission.id}
                          amount={Number(commission.commissionAmount)}
                        />
                      ) : commission.payout ? (
                        <span className="text-xs text-zinc-400">
                          Wniosek złożony
                        </span>
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
