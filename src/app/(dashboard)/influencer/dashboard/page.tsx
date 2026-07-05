import Link from "next/link";
import { redirect } from "next/navigation";
import { MousePointerClick, TrendingUp, Wallet, PiggyBank, AlertTriangle } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClicksChart } from "@/components/charts/ClicksChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { Button } from "@/components/ui/button";
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

function pctTrend(current: number, previous: number): { value: string; positive: boolean } | undefined {
  if (previous === 0) {
    if (current === 0) return undefined;
    return { value: "Nowe", positive: true };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
    positive: change >= 0,
  };
}

export default async function InfluencerDashboardPage() {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      preferredPayout: true,
      bankAccountIban: true,
      paypalEmail: true,
    },
  });
  if (!profile) {
    redirect("/influencer/onboarding");
  }

  const hasBankDetails =
    (profile.preferredPayout === "bank" && !!profile.bankAccountIban) ||
    (profile.preferredPayout === "paypal" && !!profile.paypalEmail);

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start30DaysAgo = new Date(now);
  start30DaysAgo.setDate(start30DaysAgo.getDate() - 29);
  start30DaysAgo.setHours(0, 0, 0, 0);
  const start12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    totalsAgg,
    clicksThisMonth,
    clicksLastMonth,
    approvedBalanceAgg,
    clicksLast30Days,
    commissionsLast12Months,
    topLinks,
    recentCommissions,
  ] = await Promise.all([
    prisma.affiliateLink.aggregate({
      where: { influencerProfileId: profile.id },
      _sum: { totalClicks: true, totalConversions: true, totalEarnings: true },
    }),
    prisma.click.count({
      where: {
        affiliateLink: { influencerProfileId: profile.id },
        createdAt: { gte: startOfThisMonth },
      },
    }),
    prisma.click.count({
      where: {
        affiliateLink: { influencerProfileId: profile.id },
        createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
      },
    }),
    prisma.commission.aggregate({
      where: { influencerId: profile.id, status: "APPROVED", payout: null },
      _sum: { commissionAmount: true },
    }),
    prisma.click.findMany({
      where: {
        affiliateLink: { influencerProfileId: profile.id },
        createdAt: { gte: start30DaysAgo },
      },
      select: { createdAt: true },
    }),
    prisma.commission.findMany({
      where: { influencerId: profile.id, createdAt: { gte: start12MonthsAgo } },
      select: { commissionAmount: true, createdAt: true },
    }),
    prisma.affiliateLink.findMany({
      where: { influencerProfileId: profile.id },
      include: { product: true },
      orderBy: { totalEarnings: "desc" },
      take: 5,
    }),
    prisma.commission.findMany({
      where: { influencerId: profile.id },
      include: { product: { select: { name: true } }, brand: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalClicks = totalsAgg._sum.totalClicks ?? 0;
  const totalConversions = totalsAgg._sum.totalConversions ?? 0;
  const totalEarnings = Number(totalsAgg._sum.totalEarnings ?? 0);
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const availableBalance = Number(approvedBalanceAgg._sum.commissionAmount ?? 0);

  // Bucketuj kliknięcia dziennie na potrzeby AreaChart (ostatnie 30 dni).
  const dailyClicksMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(start30DaysAgo);
    d.setDate(d.getDate() + i);
    dailyClicksMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const click of clicksLast30Days) {
    const key = click.createdAt.toISOString().slice(0, 10);
    dailyClicksMap.set(key, (dailyClicksMap.get(key) ?? 0) + 1);
  }
  const dailyClicksData = Array.from(dailyClicksMap.entries()).map(([date, clicks]) => ({
    date,
    clicks,
  }));

  // Bucketuj zarobki miesięcznie na potrzeby BarChart (ostatnie 12 miesięcy).
  const monthlyEarningsMap = new Map<string, number>();
  const monthKeys: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(start12MonthsAgo.getFullYear(), start12MonthsAgo.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
    monthlyEarningsMap.set(key, 0);
  }
  for (const commission of commissionsLast12Months) {
    const d = commission.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyEarningsMap.has(key)) {
      monthlyEarningsMap.set(key, (monthlyEarningsMap.get(key) ?? 0) + Number(commission.commissionAmount));
    }
  }
  const monthFormatter = new Intl.DateTimeFormat("pl-PL", { month: "short" });
  const monthlyEarningsData = monthKeys.map((key) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: monthFormatter.format(new Date(year, month - 1, 1)),
      value: monthlyEarningsMap.get(key) ?? 0,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {!hasBankDetails && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            ⚠️ Uzupełnij dane bankowe aby wypłacić zarobki.{" "}
            <Link href="/influencer/settings?tab=bank" className="font-semibold underline">
              Uzupełnij teraz →
            </Link>
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Panel influencera</h1>
          <p className="mt-1 text-sm text-muted-foreground">Twoje wyniki w skrócie.</p>
        </div>
        <Button asChild>
          <Link href="/influencer/products">Przeglądaj produkty</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Łączne kliknięcia"
          value={totalClicks.toLocaleString("pl-PL")}
          icon={MousePointerClick}
          trend={pctTrend(clicksThisMonth, clicksLastMonth)}
          description="vs poprzedni miesiąc"
        />
        <StatsCard
          title="Konwersje"
          value={totalConversions.toLocaleString("pl-PL")}
          icon={TrendingUp}
          description={`CR ${conversionRate.toFixed(1)}%`}
        />
        <StatsCard
          title="Zarobki łącznie"
          value={formatCurrency(totalEarnings)}
          icon={Wallet}
        />
        <StatsCard
          title="Dostępne do wypłaty"
          value={formatCurrency(availableBalance)}
          icon={PiggyBank}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kliknięcia — ostatnie 30 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <ClicksChart data={dailyClicksData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zarobki — ostatnie 12 miesięcy</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={monthlyEarningsData} format="currency" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Top 5 linków</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencer/links">Zobacz wszystkie</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {topLinks.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState
                  icon={MousePointerClick}
                  title="Brak linków"
                  description="Wygeneruj pierwszy link afiliacyjny, aby zacząć zarabiać."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-t hover:bg-transparent">
                    <TableHead className="pl-6">Produkt</TableHead>
                    <TableHead className="text-right">Kliknięcia</TableHead>
                    <TableHead className="text-right">Konwersje</TableHead>
                    <TableHead className="pr-6 text-right">Zarobki</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="pl-6 font-medium">
                        {link.product?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {link.totalClicks.toLocaleString("pl-PL")}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {link.totalConversions.toLocaleString("pl-PL")}
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium text-emerald-600">
                        {formatCurrency(Number(link.totalEarnings))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Ostatnie konwersje</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencer/commissions">Zobacz wszystkie</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentCommissions.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState
                  icon={TrendingUp}
                  title="Brak konwersji"
                  description="Konwersje pojawią się tutaj, gdy ktoś kupi przez Twój link."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-t hover:bg-transparent">
                    <TableHead className="pl-6">Produkt</TableHead>
                    <TableHead>Marka</TableHead>
                    <TableHead className="text-right">Kwota</TableHead>
                    <TableHead className="pr-6 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="pl-6 font-medium">
                        {commission.product?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {commission.brand?.companyName ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatCurrency(Number(commission.commissionAmount))}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <StatusBadge status={commission.status} />
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
