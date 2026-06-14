// src/app/(dashboard)/brand/stats/page.tsx
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
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

  const [topProducts, topInfluencers, recentConversions] = await Promise.all([
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

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Statystyki</h1>
        <p className="mt-1 text-muted-foreground">
          Wyniki Twoich produktów i partnerów.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 produktów (wg liczby konwersji)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produkt</TableHead>
                  <TableHead className="text-right">Konwersje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Brak danych.
                    </TableCell>
                  </TableRow>
                ) : (
                  topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">
                        {product._count.affiliateLinks.toLocaleString("pl-PL")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 influencerów (wg zarobków)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead className="text-right">Zarobki</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topInfluencers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Brak danych.
                    </TableCell>
                  </TableRow>
                ) : (
                  topInfluencers.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        {link.influencerProfile?.displayName ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(link.totalEarnings))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ostatnie konwersje</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead className="text-right">Kwota</TableHead>
                <TableHead className="text-right">Prowizja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentConversions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Brak konwersji.
                  </TableCell>
                </TableRow>
              ) : (
                recentConversions.map((conversion) => (
                  <TableRow key={conversion.id}>
                    <TableCell className="font-medium">
                      {conversion.affiliateLink?.product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(conversion.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(conversion.commission))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(conversion.status)}>
                        {conversion.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(conversion.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "CONFIRMED":
    case "PAID":
      return "default";
    case "REJECTED":
      return "destructive";
    case "PENDING":
    default:
      return "secondary";
  }
}
