import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getBrandCommissionsAction } from "@/actions/commission.actions";
import { CommissionActions } from "@/components/brand/CommissionActions";
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

export default async function BrandCommissionsPage() {
  const session = await auth();
  if (session?.user?.role !== "BRAND") {
    redirect("/brand/dashboard");
  }

  const result = await getBrandCommissionsAction();
  const commissions = result.success ? result.data : [];
  const pendingCount = commissions.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Komisje
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {pendingCount > 0
              ? `${pendingCount} oczekuje na decyzję`
              : "Brak komisji oczekujących na decyzję"}
          </p>
        </div>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Influencer</TableHead>
              <TableHead>Produkt</TableHead>
              <TableHead className="text-right">Wartość zamówienia</TableHead>
              <TableHead className="text-right">Prowizja %</TableHead>
              <TableHead className="text-right">Kwota prowizji</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm text-zinc-500"
                >
                  Brak komisji do wyświetlenia.
                </TableCell>
              </TableRow>
            ) : (
              commissions.map((commission) => {
                const badge =
                  statusBadge[commission.status] ?? statusBadge.PENDING;
                return (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium text-zinc-900">
                      {commission.influencer?.displayName ?? "—"}
                    </TableCell>
                    <TableCell className="text-zinc-700">
                      {commission.product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-zinc-700">
                      {formatPLN(Number(commission.orderValue))}
                    </TableCell>
                    <TableCell className="text-right text-zinc-700">
                      {Number(commission.commissionPercent)}%
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
                      <CommissionActions
                        commissionId={commission.id}
                        status={commission.status}
                      />
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
