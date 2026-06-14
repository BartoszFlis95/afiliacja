import Link from "next/link";
import { redirect } from "next/navigation";
import { MousePointerClick, TrendingUp, DollarSign, Percent } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInfluencerStatsAction } from "@/actions/influencer.actions";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

type InfluencerStats = {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  conversionRate: number;
};

const STAT_CARDS = [
  {
    key: "totalClicks" as const,
    label: "Kliknięcia",
    icon: MousePointerClick,
    color: "bg-blue-100 text-blue-600",
    format: (v: number) => v.toLocaleString("pl-PL"),
  },
  {
    key: "totalConversions" as const,
    label: "Konwersje",
    icon: TrendingUp,
    color: "bg-violet-100 text-violet-600",
    format: (v: number) => v.toLocaleString("pl-PL"),
  },
  {
    key: "totalEarnings" as const,
    label: "Zarobki",
    icon: DollarSign,
    color: "bg-emerald-100 text-emerald-600",
    format: (v: number) => formatCurrency(v),
  },
  {
    key: "conversionRate" as const,
    label: "Wsp. konwersji",
    icon: Percent,
    color: "bg-indigo-100 text-indigo-600",
    format: (v: number) => `${v.toFixed(1)}%`,
  },
];

export default async function InfluencerDashboardPage() {
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

  const [statsResult, recentLinks] = await Promise.all([
    getInfluencerStatsAction(),
    prisma.affiliateLink.findMany({
      where: { influencerProfileId: profile.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats: InfluencerStats = statsResult.success
    ? (statsResult.data as InfluencerStats)
    : { totalClicks: 0, totalConversions: 0, totalEarnings: 0, conversionRate: 0 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Panel influencera</h1>
          <p className="mt-1 text-sm text-muted-foreground">Twoje wyniki w skrócie.</p>
        </div>
        <Button asChild>
          <Link href="/influencer/products">Przeglądaj produkty</Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, format }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {format(stats[key])}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Ostatnie linki</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/influencer/links">Zobacz wszystkie</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-t hover:bg-transparent">
                <TableHead className="pl-6">Produkt</TableHead>
                <TableHead className="text-right">Kliknięcia</TableHead>
                <TableHead className="pr-6 text-right">Zarobki</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                    Nie masz jeszcze żadnych linków.
                  </TableCell>
                </TableRow>
              ) : (
                recentLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="pl-6 font-medium">
                      {link.product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {link.totalClicks.toLocaleString("pl-PL")}
                    </TableCell>
                    <TableCell className="pr-6 text-right font-medium text-emerald-600">
                      {formatCurrency(Number(link.totalEarnings))}
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
