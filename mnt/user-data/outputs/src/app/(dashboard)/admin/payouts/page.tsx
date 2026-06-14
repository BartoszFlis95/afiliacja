import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PayoutActions } from "@/components/admin/PayoutActions";
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
  PROCESSING: { label: "W realizacji", className: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Wypłacona", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Odrzucona", className: "bg-red-100 text-red-800" },
};

const formatPLN = (value: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(
    value
  );

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(date);

export default async function AdminPayoutsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const payouts = await prisma.payout.findMany({
    include: {
      influencer: true,
      commission: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Wypłaty
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Zatwierdzaj wnioski i oznaczaj zrealizowane przelewy.
        </p>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Influencer</TableHead>
              <TableHead>Produkt</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
              <TableHead>Konto bankowe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-zinc-500"
                >
                  Brak wypłat do wyświetlenia.
                </TableCell>
              </TableRow>
            ) : (
              payouts.map((payout) => {
                const badge = statusBadge[payout.status] ?? statusBadge.PENDING;
                return (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium text-zinc-900">
                      {payout.influencer?.displayName ?? "—"}
                    </TableCell>
                    <TableCell className="text-zinc-700">
                      {payout.commission?.product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-zinc-900">
                      {formatPLN(Number(payout.amount))}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-600">
                      {payout.bankAccount}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(payout.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <PayoutActions
                        payoutId={payout.id}
                        status={payout.status}
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
