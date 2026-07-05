import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  UserPlus,
  Building2,
  Megaphone,
  Package,
  MousePointerClick,
  Wallet,
  Clock,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPlatformStatsAction } from "@/actions/admin.actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const start7DaysAgo = new Date(now);
  start7DaysAgo.setDate(start7DaysAgo.getDate() - 6);
  start7DaysAgo.setHours(0, 0, 0, 0);
  const start30DaysAgo = new Date(now);
  start30DaysAgo.setDate(start30DaysAgo.getDate() - 29);
  start30DaysAgo.setHours(0, 0, 0, 0);

  const [
    stats,
    newUsers7Days,
    activeProducts,
    clicksThisMonth,
    pendingCommissions,
    registrationsRaw,
    platformRevenueRaw,
    recentUsers,
    recentConversions,
    recentInvoices,
    invoicesThisMonth,
  ] = await Promise.all([
    getPlatformStatsAction(),
    prisma.user.count({ where: { createdAt: { gte: start7DaysAgo } } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.click.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.commission.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      where: { createdAt: { gte: start30DaysAgo } },
      select: { createdAt: true },
    }),
    prisma.conversion.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: start30DaysAgo } },
      select: { platformCommission: true, createdAt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { brandProfile: true, influencerProfile: true },
    }),
    prisma.conversion.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { affiliateLink: { include: { product: true } } },
    }),
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { brand: { select: { companyName: true } } },
    }),
    prisma.invoice.aggregate({
      where: { issuedAt: { gte: monthStart } },
      _count: { id: true },
      _sum: { grossAmount: true },
    }),
  ]);

  const registrationsMap = new Map<string, number>();
  const platformRevenueMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(start30DaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    registrationsMap.set(key, 0);
    platformRevenueMap.set(key, 0);
  }
  for (const user of registrationsRaw) {
    const key = user.createdAt.toISOString().slice(0, 10);
    registrationsMap.set(key, (registrationsMap.get(key) ?? 0) + 1);
  }
  for (const conv of platformRevenueRaw) {
    const key = conv.createdAt.toISOString().slice(0, 10);
    platformRevenueMap.set(
      key,
      (platformRevenueMap.get(key) ?? 0) + Number(conv.platformCommission)
    );
  }
  const registrationsData = Array.from(registrationsMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
  const platformRevenueData = Array.from(platformRevenueMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Panel administratora</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Przegląd kondycji platformy Deneeu.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Użytkownicy łącznie" value={stats.totalUsers.toLocaleString("pl-PL")} icon={Users} />
        <StatsCard title="Nowi (7 dni)" value={newUsers7Days.toLocaleString("pl-PL")} icon={UserPlus} />
        <StatsCard title="Marki" value={stats.totalBrands.toLocaleString("pl-PL")} icon={Building2} />
        <StatsCard title="Influencerzy" value={stats.totalInfluencers.toLocaleString("pl-PL")} icon={Megaphone} />
        <StatsCard title="Aktywne produkty" value={activeProducts.toLocaleString("pl-PL")} icon={Package} />
        <StatsCard
          title="Kliknięcia"
          value={clicksThisMonth.toLocaleString("pl-PL")}
          icon={MousePointerClick}
          description="ten miesiąc"
        />
        <StatsCard title="Przychód platformy" value={formatCurrency(stats.platformCommission)} icon={Wallet} />
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
            <CardTitle>Rejestracje — ostatnie 30 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={registrationsData}
              xKey="date"
              lines={[{ dataKey: "count", name: "Rejestracje", color: "#18181b" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Przychód platformy — ostatnie 30 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={platformRevenueData}
              xKey="date"
              lines={[{ dataKey: "revenue", name: "Przychód", color: "#18181b" }]}
              format="currency"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle>Ostatnie 10 konwersji</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentConversions.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={MousePointerClick} title="Brak konwersji" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-t hover:bg-transparent">
                  <TableHead className="pl-6">Produkt</TableHead>
                  <TableHead className="text-right">Kwota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConversions.map((conversion) => (
                  <TableRow key={conversion.id}>
                    <TableCell className="pl-6 font-medium">
                      {conversion.affiliateLink?.product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {formatCurrency(Number(conversion.amount))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={conversion.status} />
                    </TableCell>
                    <TableCell className="pr-6 text-muted-foreground">
                      {formatDate(conversion.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-muted-foreground">Faktury (ten miesiąc)</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{invoicesThisMonth._count.id}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-muted-foreground">
              Łączna wartość faktur (ten miesiąc)
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-violet-600">
              {formatCurrency(Number(invoicesThisMonth._sum.grossAmount ?? 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Ostatnie rejestracje</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsers.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={Users} title="Brak rejestracji" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-t hover:bg-transparent">
                    <TableHead className="pl-6">Email</TableHead>
                    <TableHead>Rola</TableHead>
                    <TableHead className="pr-6">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="pl-6 font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Ostatnie faktury</CardTitle>
            <Link href="/admin/invoices" className="text-sm text-muted-foreground hover:text-foreground">
              Zobacz wszystkie →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={Wallet} title="Brak faktur" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-t hover:bg-transparent">
                    <TableHead className="pl-6">Nr faktury</TableHead>
                    <TableHead>Marka</TableHead>
                    <TableHead className="text-right">Brutto</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="pl-6 font-mono text-sm font-medium">
                        <Link href={`/admin/invoices/${inv.id}`} className="hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{inv.brand.companyName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(inv.grossAmount))}
                      </TableCell>
                      <TableCell className="pr-6">
                        <StatusBadge status={inv.status} />
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
