import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MousePointerClick,
  TrendingUp,
  Wallet,
  PiggyBank,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CopyLinkButton } from "@/components/influencer/CopyLinkButton";
import { ClicksChart } from "@/components/charts/ClicksChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
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
    availableProducts,
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
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, name: true, imageUrl: true, influencerCommissionRate: true },
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
          <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl lg:text-3xl">
            Panel influencera
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Twoje wyniki w skrócie.</p>
        </div>
        <Button asChild className="shadow-sm transition-all duration-200 hover:shadow-md">
          <Link href="/influencer/products">Przeglądaj produkty</Link>
        </Button>
      </div>

      {/* Earnings highlight */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-zinc-400">
              <Wallet className="h-3.5 w-3.5" /> Zarobki łącznie
            </p>
            <p className="mt-2 text-3xl font-semibold sm:text-4xl">{formatCurrency(totalEarnings)}</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 sm:justify-start">
            <div>
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-zinc-400">
                <PiggyBank className="h-3.5 w-3.5" /> Dostępne do wypłaty
              </p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(availableBalance)}</p>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-white text-zinc-900 shadow-sm transition-all duration-200 hover:bg-zinc-100 hover:shadow-md"
            >
              <Link href="/influencer/commissions">Wypłać</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="Łączne kliknięcia"
          value={totalClicks.toLocaleString("pl-PL")}
          icon={MousePointerClick}
          trend={pctTrend(clicksThisMonth, clicksLastMonth)}
          description="vs poprzedni miesiąc"
          iconColor="blue"
        />
        <StatsCard
          title="Konwersje"
          value={totalConversions.toLocaleString("pl-PL")}
          icon={TrendingUp}
          description={`CR ${conversionRate.toFixed(1)}%`}
          iconColor="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle>Kliknięcia — ostatnie 30 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <ClicksChart data={dailyClicksData} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle>Zarobki — ostatnie 12 miesięcy</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={monthlyEarningsData} format="currency" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-zinc-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Top 5 linków</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencer/links">Zobacz wszystkie</Link>
            </Button>
          </CardHeader>
          <CardContent className={topLinks.length === 0 ? "p-0" : "space-y-3 px-6 pb-6"}>
            {topLinks.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState
                  icon={MousePointerClick}
                  title="Brak linków"
                  description="Wygeneruj pierwszy link afiliacyjny, aby zacząć zarabiać."
                />
              </div>
            ) : (
              topLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-100 p-4 transition-all duration-200 hover:border-zinc-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {link.product?.name ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {link.totalClicks.toLocaleString("pl-PL")} kliknięć ·{" "}
                      {link.totalConversions.toLocaleString("pl-PL")} konwersji ·{" "}
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(Number(link.totalEarnings))}
                      </span>
                    </p>
                  </div>
                  <CopyLinkButton code={link.code} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-100 shadow-sm">
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

      {/* Dostępne produkty — mini-grid */}
      {availableProducts.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Dostępne produkty</h2>
            <Link
              href="/influencer/products"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
            >
              Zobacz wszystkie →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {availableProducts.map((product) => (
              <Link
                key={product.id}
                href="/influencer/products"
                className="group overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
              >
                <div className="relative h-24 w-full bg-zinc-50">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-zinc-300" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-xs font-medium text-zinc-900">{product.name}</p>
                  <Badge variant="outline" className="mt-1.5 border-zinc-200 text-[10px] text-zinc-600">
                    {Number(product.influencerCommissionRate).toFixed(1).replace(/\.0$/, "")}% prowizji
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
