import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  MousePointerClick,
  Package,
  PlusCircle,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

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
        status: { in: ["CONFIRMED", "PAID"] },
      },
      _sum: { amount: true },
    }),
    prisma.commission.count({ where: { brandId: brandProfile.id, status: "PENDING" } }),
    prisma.conversion.findMany({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
        status: { in: ["CONFIRMED", "PAID"] },
        createdAt: { gte: start30DaysAgo },
      },
      select: { amount: true, createdAt: true },
    }),
    prisma.conversion.findMany({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
        status: { in: ["CONFIRMED", "PAID"] },
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
  const maxInfluencerEarnings = Math.max(
    1,
    ...topInfluencers.map((l) => Number(l.totalEarnings))
  );

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

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-100 bg-gradient-to-br from-zinc-50 via-white to-blue-50/50 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl lg:text-3xl">
              Witaj, {brandProfile.companyName}!
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Oto podsumowanie Twojej działalności afiliacyjnej.
            </p>
          </div>
          <Button asChild className="shadow-sm transition-all duration-200 hover:shadow-md">
            <Link href="/brand/products/new">Dodaj produkt</Link>
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: "/brand/products/new", icon: PlusCircle, label: "Dodaj produkt" },
          { href: "/brand/stats", icon: BarChart3, label: "Zobacz raporty" },
          { href: "/brand/influencers", icon: Users, label: "Influencerzy" },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3.5 text-sm font-medium text-zinc-700 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-zinc-200 hover:shadow-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Aktywne produkty" value={activeProducts} icon={Package} iconColor="blue" />
        <StatsCard title="Aktywni influencerzy" value={activeInfluencers} icon={Users} iconColor="violet" />
        <StatsCard
          title="Kliknięcia"
          value={clicksThisMonth.toLocaleString("pl-PL")}
          icon={MousePointerClick}
          description="ten miesiąc"
          iconColor="zinc"
        />
        <StatsCard
          title="Konwersje"
          value={conversionsThisMonth.toLocaleString("pl-PL")}
          icon={TrendingUp}
          description="ten miesiąc"
          iconColor="emerald"
        />
        <StatsCard
          title="Przychód z afiliacji"
          value={formatCurrency(totalRevenue)}
          icon={Wallet}
          iconColor="emerald"
        />
        <StatsCard
          title="Prowizje do zatwierdzenia"
          value={pendingCommissions}
          icon={Clock}
          description={pendingCommissions > 0 ? "wymaga akcji" : "brak zaległości"}
          iconColor="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle>Przychód — ostatnie 30 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={dailyRevenueData}
              xKey="date"
              lines={[{ dataKey: "revenue", name: "Przychód", color: "#2563EB" }]}
              format="currency"
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle>Top produkty wg przychodu</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={topProductsData} format="currency" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-zinc-100 shadow-sm">
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
                    const earningsShare = (Number(link.totalEarnings) / maxInfluencerEarnings) * 100;
                    const initials = link.influencerProfile.displayName.slice(0, 2).toUpperCase();
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="pl-6 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate">{link.influencerProfile.displayName}</p>
                              <div className="mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-zinc-100">
                                <div
                                  className="h-full rounded-full bg-zinc-900"
                                  style={{ width: `${earningsShare}%` }}
                                />
                              </div>
                            </div>
                          </div>
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

        <Card className="rounded-2xl border-zinc-100 shadow-sm">
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
              <ul className="divide-y divide-slate-100">
                {recentCommissions.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-6 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{c.product?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{c.influencer?.displayName ?? "—"}</p>
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
