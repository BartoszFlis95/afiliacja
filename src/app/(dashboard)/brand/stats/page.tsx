// src/app/(dashboard)/brand/stats/page.tsx
import { redirect } from "next/navigation";
import { BarChart3, Package, Receipt } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBrandRangeStatsAction } from "@/actions/brand.actions";
import { BrandStatsClient } from "@/components/brand/BrandStatsClient";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
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

export const dynamic = "force-dynamic";

export default async function BrandStatsPage() {
  const session = await auth();
  if (session?.user?.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brandProfile) {
    redirect("/brand/onboarding");
  }

  const [rangeResult, topProducts, topInfluencers, recentConversions] = await Promise.all([
    getBrandRangeStatsAction(30),
    prisma.product.findMany({
      where: { brandProfileId: brandProfile.id },
      include: { _count: { select: { affiliateLinks: true } } },
      orderBy: { affiliateLinks: { _count: "desc" } },
      take: 5,
    }),
    prisma.affiliateLink.findMany({
      where: { product: { brandProfileId: brandProfile.id } },
      include: { influencerProfile: true },
      orderBy: { totalEarnings: "desc" },
      take: 5,
    }),
    prisma.conversion.findMany({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
      },
      include: {
        affiliateLink: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const initialData =
    rangeResult.success && rangeResult.data
      ? rangeResult.data
      : { dailyData: [], revenueByProduct: [], performanceByInfluencer: [] };

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Statystyki</h1>
        <p className="mt-1 text-muted-foreground">Wyniki Twoich produktów i partnerów.</p>
      </header>

      <BrandStatsClient initialData={initialData} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 produktów (wg liczby linków)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={Package} title="Brak danych" className="border-0" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[360px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Produkt</TableHead>
                      <TableHead className="pr-6 text-right">Linki</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="pl-6 font-medium">{product.name}</TableCell>
                        <TableCell className="pr-6 text-right">
                          {product._count.affiliateLinks.toLocaleString("pl-PL")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 influencerów (wg zarobków)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topInfluencers.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={BarChart3} title="Brak danych" className="border-0" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[360px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Influencer</TableHead>
                      <TableHead className="pr-6 text-right">Zarobki</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topInfluencers.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="pl-6 font-medium">
                          {link.influencerProfile?.displayName ?? "—"}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          {formatCurrency(Number(link.totalEarnings))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ostatnie konwersje</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentConversions.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Receipt} title="Brak konwersji" className="border-0" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Produkt</TableHead>
                    <TableHead className="text-right">Kwota</TableHead>
                    <TableHead className="text-right">Prowizja</TableHead>
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
                      <TableCell className="text-right">
                        {formatCurrency(Number(conversion.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(conversion.commission))}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
