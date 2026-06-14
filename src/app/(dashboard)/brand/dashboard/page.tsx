import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
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
import { Package, MousePointerClick, TrendingUp, DollarSign } from "lucide-react";

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

  const [
    totalProducts,
    activeProducts,
    totalClicks,
    totalConversions,
    revenueData,
    topInfluencers,
  ] = await Promise.all([
    prisma.product.count({ where: { brandProfileId: brandProfile.id } }),
    prisma.product.count({
      where: { brandProfileId: brandProfile.id, status: "ACTIVE" },
    }),
    prisma.click.count({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
      },
    }),
    prisma.conversion.count({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
      },
    }),
    prisma.conversion.aggregate({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
        status: "CONFIRMED",
      },
      _sum: { amount: true },
    }),
    prisma.affiliateLink.findMany({
      where: { product: { brandProfileId: brandProfile.id } },
      include: { influencerProfile: true },
      orderBy: { totalEarnings: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenue = revenueData._sum.amount ?? 0;

  const statCards = [
    {
      label: "Aktywne produkty",
      value: activeProducts,
      sub: `z ${totalProducts} wszystkich`,
      icon: Package,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      label: "Łączne kliknięcia",
      value: totalClicks.toLocaleString(),
      sub: "wszystkie linki afiliacyjne",
      icon: MousePointerClick,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Konwersje",
      value: totalConversions.toLocaleString(),
      sub: "łączna liczba konwersji",
      icon: TrendingUp,
      color: "bg-violet-100 text-violet-600",
    },
    {
      label: "Przychód",
      value: formatCurrency(Number(totalRevenue)),
      sub: "potwierdzone konwersje",
      icon: DollarSign,
      color: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top influencers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Top Influencerzy</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/brand/influencers">Zobacz wszystkich</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {topInfluencers.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              Brak influencerów promujących Twoje produkty.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-t hover:bg-transparent">
                  <TableHead className="pl-6">Influencer</TableHead>
                  <TableHead className="text-right">Kliknięcia</TableHead>
                  <TableHead className="text-right">Konwersje</TableHead>
                  <TableHead className="pr-6 text-right">Zarobki</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topInfluencers.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="pl-6 font-medium">
                      {link.influencerProfile.displayName}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {link.totalClicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {link.totalConversions.toLocaleString()}
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
    </div>
  );
}
