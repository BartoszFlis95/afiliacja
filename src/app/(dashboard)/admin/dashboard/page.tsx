import Link from "next/link";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  UserPlus,
  Building2,
  Megaphone,
  Package,
  MousePointerClick,
  Wallet,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPlatformStatsAction, getSuspiciousCommissionsAction } from "@/actions/admin.actions";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    suspiciousCommissions,
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
    getSuspiciousCommissionsAction(),
    prisma.user.findMany({
      where: { createdAt: { gte: start30DaysAgo } },
      select: { createdAt: true },
    }),
    prisma.conversion.findMany({
      where: { status: { in: ["CONFIRMED", "PAID"] }, createdAt: { gte: start30DaysAgo } },
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

  // Recent activity feed — scala 3 osobne źródła (konwersje/rejestracje/faktury)
  // w jedną chronologiczną oś czasu zamiast trzech osobnych tabel.
  type ActivityEntry = {
    id: string;
    timestamp: Date;
    icon: LucideIcon;
    iconColor: string;
    title: string;
    subtitle: string;
    amount?: string;
    href?: string;
  };

  const activity: ActivityEntry[] = [
    ...recentConversions.map((c) => ({
      id: `conv-${c.id}`,
      timestamp: c.createdAt,
      icon: MousePointerClick,
      iconColor: "bg-blue-50 text-blue-600",
      title: c.affiliateLink?.product?.name ?? "Konwersja",
      subtitle: "Nowa konwersja",
      amount: formatCurrency(Number(c.amount)),
    })),
    ...recentUsers.map((u) => ({
      id: `user-${u.id}`,
      timestamp: u.createdAt,
      icon: UserPlus,
      iconColor: "bg-emerald-50 text-emerald-600",
      title: u.email,
      subtitle: `Nowa rejestracja · ${u.role}`,
    })),
    ...recentInvoices.map((inv) => ({
      id: `inv-${inv.id}`,
      timestamp: inv.createdAt,
      icon: FileText,
      iconColor: "bg-violet-50 text-violet-600",
      title: inv.invoiceNumber,
      subtitle: `Faktura · ${inv.brand.companyName}`,
      amount: formatCurrency(Number(inv.grossAmount)),
      href: `/admin/invoices/${inv.id}`,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 12);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl lg:text-3xl">
          Panel administratora
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Przegląd kondycji platformy Deneeu.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Użytkownicy łącznie"
          value={stats.totalUsers.toLocaleString("pl-PL")}
          icon={Users}
          iconColor="zinc"
        />
        <StatsCard
          title="Nowi (7 dni)"
          value={newUsers7Days.toLocaleString("pl-PL")}
          icon={UserPlus}
          iconColor="emerald"
        />
        <StatsCard
          title="Marki"
          value={stats.totalBrands.toLocaleString("pl-PL")}
          icon={Building2}
          iconColor="blue"
        />
        <StatsCard
          title="Influencerzy"
          value={stats.totalInfluencers.toLocaleString("pl-PL")}
          icon={Megaphone}
          iconColor="violet"
        />
        <StatsCard
          title="Aktywne produkty"
          value={activeProducts.toLocaleString("pl-PL")}
          icon={Package}
          iconColor="blue"
        />
        <StatsCard
          title="Kliknięcia"
          value={clicksThisMonth.toLocaleString("pl-PL")}
          icon={MousePointerClick}
          description="ten miesiąc"
          iconColor="zinc"
        />
        <StatsCard
          title="Przychód platformy"
          value={formatCurrency(stats.platformCommission)}
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
        <Link href="/admin/commissions?tab=suspicious" className="block">
          <StatsCard
            title="Podejrzane komisje"
            value={suspiciousCommissions.length}
            icon={AlertTriangle}
            description={suspiciousCommissions.length > 0 ? "wymaga weryfikacji" : "brak zgłoszeń"}
            iconColor="red"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle>Rejestracje — ostatnie 30 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={registrationsData}
              xKey="date"
              lines={[{ dataKey: "count", name: "Rejestracje", color: "#2563EB" }]}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-100 shadow-sm">
          <CardHeader>
            <CardTitle>Przychód platformy — ostatnie 30 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={platformRevenueData}
              xKey="date"
              lines={[{ dataKey: "revenue", name: "Przychód", color: "#2563EB" }]}
              format="currency"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-zinc-100 shadow-sm">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-muted-foreground">Faktury (ten miesiąc)</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{invoicesThisMonth._count.id}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-zinc-100 shadow-sm">
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

      {/* Recent activity — jedna oś czasu zamiast trzech osobnych tabel */}
      <Card className="rounded-2xl border-zinc-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Ostatnia aktywność</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <EmptyState icon={Clock} title="Brak ostatniej aktywności" />
          ) : (
            <ul className="space-y-0">
              {activity.map((item, index) => {
                const Icon = item.icon;
                const row = (
                  <div className="flex items-start gap-3 py-3">
                    <div className="relative flex flex-col items-center self-stretch">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          item.iconColor
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {index < activity.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-zinc-100" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pb-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">{item.title}</p>
                        <p className="text-xs text-zinc-500">{item.subtitle}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {item.amount && (
                          <p className="text-sm font-medium text-emerald-600">{item.amount}</p>
                        )}
                        <p className="text-xs text-zinc-400">{formatDate(item.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                );
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} className="-mx-2 block rounded-lg px-2 hover:bg-zinc-50">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
