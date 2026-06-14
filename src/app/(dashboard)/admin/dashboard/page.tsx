import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { Users, Building2, Megaphone, Package, MousePointerClick, TrendingUp } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPlatformStatsAction } from "@/actions/admin.actions";
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

const STAT_CARDS = [
  { key: "totalUsers" as const,       label: "Użytkownicy",  icon: Users,             color: "bg-indigo-100 text-indigo-600" },
  { key: "totalBrands" as const,      label: "Marki",         icon: Building2,          color: "bg-violet-100 text-violet-600" },
  { key: "totalInfluencers" as const, label: "Influencerzy",  icon: Megaphone,          color: "bg-blue-100 text-blue-600" },
  { key: "totalProducts" as const,    label: "Produkty",      icon: Package,            color: "bg-amber-100 text-amber-600" },
  { key: "totalClicks" as const,      label: "Kliknięcia",    icon: MousePointerClick,  color: "bg-sky-100 text-sky-600" },
  { key: "totalConversions" as const, label: "Konwersje",     icon: TrendingUp,         color: "bg-emerald-100 text-emerald-600" },
];

export default async function AdminDashboardPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const [stats, recentUsers, recentConversions] = await Promise.all([
    getPlatformStatsAction(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { brandProfile: true, influencerProfile: true },
    }),
    prisma.conversion.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        affiliateLink: { include: { product: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Panel administratora</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Przegląd kondycji platformy Deneeu.
        </p>
      </header>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
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
                {(stats[key] ?? 0).toLocaleString("pl-PL")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-medium text-muted-foreground">Łączny obrót z konwersji</p>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-foreground">{formatPrice(stats.totalRevenue)}</p>
        </CardContent>
      </Card>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Ostatnie rejestracje</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-t hover:bg-transparent">
                  <TableHead className="pl-6">Email</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead className="pr-6">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                      Brak rejestracji.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="pl-6 font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Ostatnie konwersje</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                {recentConversions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Brak konwersji.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentConversions.map((conversion) => (
                    <TableRow key={conversion.id}>
                      <TableCell className="pl-6 font-medium">
                        {conversion.affiliateLink?.product?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatPrice(Number(conversion.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(conversion.status)}>
                          {statusLabel(conversion.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-muted-foreground">
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
    </div>
  );
}

function statusVariant(status: string): "success" | "warning" | "destructive" | "default" {
  switch (status) {
    case "CONFIRMED": return "success";
    case "REJECTED":  return "destructive";
    case "PENDING":   return "warning";
    default:          return "default";
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING:   "Oczekuje",
    CONFIRMED: "Potwierdzona",
    REJECTED:  "Odrzucona",
    PAID:      "Wypłacona",
  };
  return labels[status] ?? status;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(date);
}

function formatPrice(value: number | Prisma.Decimal): string {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(Number(value));
}
