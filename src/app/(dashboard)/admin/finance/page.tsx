import { redirect } from "next/navigation";
import { Banknote, Clock3, TrendingUp, Wallet, Wallet2 } from "lucide-react";

import { auth } from "@/lib/auth";
import { getFinanceSummaryAction } from "@/actions/admin.actions";
import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ExportCSVButton } from "@/components/shared/ExportCSVButton";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const summary = await getFinanceSummaryAction();

  const monthlyCsv = summary.monthlyRevenue.map((m) => ({
    Miesiąc: m.label,
    Obrót: m.value.toFixed(2),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">Finanse</h1>
        <p className="mt-1 text-sm text-slate-500">Podsumowanie finansowe platformy.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Łączny obrót" value={formatCurrency(summary.totalRevenue)} icon={TrendingUp} />
        <StatsCard
          title="Prowizje influencerów"
          value={formatCurrency(summary.influencerCommissions)}
          icon={Wallet2}
        />
        <StatsCard title="Przychód platformy" value={formatCurrency(summary.platformRevenue)} icon={Banknote} />
        <StatsCard title="Oczekujące wypłaty" value={formatCurrency(summary.pendingPayouts)} icon={Clock3} />
        <StatsCard title="Wypłacone łącznie" value={formatCurrency(summary.totalPaidOut)} icon={Wallet} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Obrót miesięcznie — ostatnie 12 miesięcy</CardTitle>
          <ExportCSVButton data={monthlyCsv} filename="finanse-miesięcznie" />
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={summary.monthlyRevenue} format="currency" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ranking: influencerzy wg wypłat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary.topInfluencersByPayout.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState icon={Wallet2} title="Brak zrealizowanych wypłat" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-t hover:bg-transparent">
                    <TableHead className="pl-6">Influencer</TableHead>
                    <TableHead className="pr-6 text-right">Wypłacono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.topInfluencersByPayout.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="pl-6 font-medium">{row.label}</TableCell>
                      <TableCell className="pr-6 text-right font-medium text-emerald-600">
                        {formatCurrency(row.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking: marki wg przychodu</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary.topBrandsByRevenue.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState icon={Banknote} title="Brak potwierdzonych konwersji" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-t hover:bg-transparent">
                    <TableHead className="pl-6">Marka</TableHead>
                    <TableHead className="pr-6 text-right">Przychód</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.topBrandsByRevenue.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="pl-6 font-medium">{row.label}</TableCell>
                      <TableCell className="pr-6 text-right font-medium text-emerald-600">
                        {formatCurrency(row.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
