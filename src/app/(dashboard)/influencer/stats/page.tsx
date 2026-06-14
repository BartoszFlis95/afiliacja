// src/app/(dashboard)/influencer/stats/page.tsx
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

export default async function InfluencerStatsPage() {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    redirect("/influencer/onboarding");
  }

  const [topLinks, recentConversions, earningsAggregate] = await Promise.all([
    prisma.affiliateLink.findMany({
      where: { influencerProfileId: profile.id },
      include: { product: true },
      orderBy: { totalClicks: "desc" },
      take: 5,
    }),
    prisma.conversion.findMany({
      where: { affiliateLink: { influencerProfileId: profile.id } },
      include: { affiliateLink: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.affiliateLink.aggregate({
      where: { influencerProfileId: profile.id },
      _sum: { totalEarnings: true },
    }),
  ]);

  const totalEarnings = Number(earningsAggregate._sum.totalEarnings ?? 0);

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Statystyki</h1>
        <p className="mt-1 text-muted-foreground">
          Szczegółowy obraz Twoich wyników.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Łączne zarobki
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalEarnings)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 produktów (wg kliknięć)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead className="text-right">Kliknięcia</TableHead>
                <TableHead className="text-right">Konwersje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Brak danych.
                  </TableCell>
                </TableRow>
              ) : (
                topLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {link.totalClicks.toLocaleString("pl-PL")}
                    </TableCell>
                    <TableCell className="text-right">
                      {link.totalConversions.toLocaleString("pl-PL")}
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
