import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Clock, MousePointerClick, Package, TrendingUp, Users, Wallet } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function BrandDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!brandProfile) {
    redirect("/brand/onboarding");
  }

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start30DaysAgo = new Date(now);
  start30DaysAgo.setDate(start30DaysAgo.getDate() - 29);
  start30DaysAgo.setHours(0, 0, 0, 0);

  const [
    activeProducts,
    activeInfluencers,
    clicksThisMonth,
    conversionsThisMonth,
    revenueAgg,
    pendingCommissions,
    revenueLast30Days,
    revenueByProduct,
    topInfluencers,
    recentCommissions,
  ] = await Promise.all([
    prisma.product.count({ where: { brandProfileId: brandProfile.id, status: "ACTIVE" } }),
    prisma.affiliateLink
      .findMany({
        where: { product: { brandProfileId: brandProfile.id } },
        distinct: ["influencerProfileId"],
        select: { influencerProfileId: true },
      })
      .then((rows) => rows.length),
    prisma.click.count({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
        createdAt: { gte: startOfThisMonth },
      },
    }),
    prisma.conversion.count({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
        createdAt: { gte: startOfThisMonth },
      },
    }),
    prisma.conversion.aggregate({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
        status: "CONFIRMED",
      },
      _sum: { amount: true },
    }),
    prisma.commission.count({ where: { brandId: brandProfile.id, status: "PENDING" } }),
    prisma.conversion.findMany({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
        status: "CONFIRMED",
        createdAt: { gte: start30DaysAgo },
      },
      select: { amount: true, createdAt: true },
    }),
    prisma.conversion.findMany({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
        status: "CONFIRMED",
      },
      select: { amount: true, affiliateLink: { select: { product: { select: { name: true } } } } },
    }),
    prisma.affiliateLink.findMany({
      where: { product: { brandProfileId: brandProfile.id } },
      include: { influencerProfile: true },
      orderBy: { totalEarnings: "desc" },
      take: 5,
    }),
    prisma.commission.findMany({
      where: { brandId: brandProfile.id },
      include: { influencer: { select: { displayName: true } }, product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenue = Number(revenueAgg._sum.amount ?? 0);

  const dailyRevenueMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(start30DaysAgo);
    d.setDate(d.getDate() + i);
    dailyRevenueMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const conv of revenueLast30Days) {
    const key = conv.createdAt.toISOString().slice(0, 10);
    dailyRevenueMap.set(key, (dailyRevenueMap.get(key) ?? 0) + Number(conv.amount));
  }
  const dailyRevenueData = Array.from(dailyRevenueMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  const revenueByProductMap = new Map<string, number>();
  for (const conv of revenueByProduct) {
    const name = conv.affiliateLink?.product?.name ?? "—";
    revenueByProductMap.set(name, (revenueByProductMap.get(name) ?? 0) + Number(conv.amount));
  }
  const topProductsData = Array.from(revenueByProductMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6 sm:space-y-8">
      {!brandProfile.apiKey && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            ⚠️ Skonfiguruj webhook aby śledzić sprzedaż.{" "}
            <Link href="/brand/settings" className="font-semibold underline">
              Przejdź do ustawień →
            </Link>
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Witaj, {brandProfile.companyName}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Oto podsumowanie Twojej działalności afiliacyjnej.
          </p>
        </div>
        <Button asChild>
          <Link href="/brand/products/new">Dodaj produkt</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard title="Aktywne produkty" value={activeProducts} icon={Package} />
        <StatsCard title="Aktywni influencerzy" value={activeInfluencers} icon={Users} />
        <StatsCard
          title="Kliknięcia"
          value={clicksThisMonth.toLocaleString("pl-PL")}
          icon={MousePointerClick}
          description="ten miesiąc"
        />
        <StatsCard
          title="Konwersje"
          value={conversionsThisMonth.toLocaleString("pl-PL")}
          icon={TrendingUp}
          description="ten miesiąc"
        />
        <StatsCard title="Przychód z afiliacji" value={formatCurrency(totalRevenue)} icon={Wallet} />
        <StatsCard
          title="Prowizje do zatwierdzenia"
          value={pendingCommissions}
          icon={Clock}
          description={pendingCommissions > 0 ? "wymaga akcji" : "brak zaległości"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Przychód — ostatnie 30 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={dailyRevenueData}
              xKey="date"
              lines={[{ dataKey: "revenue", name: "Przychód", color: "#18181b" }]}
              format="currency"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top produkty wg przychodu</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={topProductsData} format="currency" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Top influencerzy</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/brand/influencers">Zobacz wszystkich</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {topInfluencers.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState icon={Users} title="Brak influencerów promujących Twoje produkty" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-t hover:bg-transparent">
                    <TableHead className="pl-6">Influencer</TableHead>
                    <TableHead className="text-right">Kliknięcia</TableHead>
                    <TableHead className="text-right">CR%</TableHead>
                    <TableHead className="pr-6 text-right">Zarobki</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topInfluencers.map((link) => {
                    const cr = link.totalClicks > 0 ? (link.totalConversions / link.totalClicks) * 100 : 0;
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="pl-6 font-medium">
                          {link.influencerProfile.displayName}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {link.totalClicks.toLocaleString("pl-PL")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {cr.toFixed(1)}%
                        </TableCell>
                        <TableCell className="pr-6 text-right font-medium text-emerald-600">
                          {formatCurrency(Number(link.totalEarnings))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Ostatnie konwersje</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/brand/commissions">Zobacz wszystkie</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentCommissions.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState icon={TrendingUp} title="Brak ostatnich konwersji" />
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {recentCommissions.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-6 py-3 text-sm">
                    <div>
                      <p className="font-medium text-zinc-900">{c.product?.name ?? "—"}</p>
                      <p className="text-xs text-zinc-500">{c.influencer?.displayName ?? "—"}</p>
                    </div>
                    <p className="font-medium text-emerald-600">
                      {formatCurrency(Number(c.orderValue))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
