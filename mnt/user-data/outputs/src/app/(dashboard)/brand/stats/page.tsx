import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const statusConfig = {
  PENDING:   { label: "Oczekująca",   variant: "secondary"   as const },
  CONFIRMED: { label: "Potwierdzona", variant: "default"     as const },
  REJECTED:  { label: "Odrzucona",   variant: "destructive" as const },
  PAID:      { label: "Wypłacona",   variant: "outline"     as const },
};

export default async function BrandStatsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) redirect("/brand/onboarding");

  const [topInfluencers, recentConversions, totalClicks, totalConversions, allProducts] =
    await Promise.all([
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
          affiliateLink: {
            include: {
              product: { select: { name: true } },
              influencerProfile: { select: { displayName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.click.count({
        where: { affiliateLink: { product: { brandProfileId: brandProfile.id } } },
      }),
      prisma.conversion.count({
        where: { affiliateLink: { product: { brandProfileId: brandProfile.id } } },
      }),
      prisma.product.findMany({
        where: { brandProfileId: brandProfile.id },
        include: {
          affiliateLinks: {
            select: { totalClicks: true, totalConversions: true, totalEarnings: true },
          },
        },
      }),
    ]);

  const topProducts = allProducts
    .map((p) => ({
      id: p.id,
      name: p.name,
      totalClicks: p.affiliateLinks.reduce((s, l) => s + l.totalClicks, 0),
      totalConversions: p.affiliateLinks.reduce((s, l) => s + l.totalConversions, 0),
      totalEarnings: p.affiliateLinks.reduce((s, l) => s + l.totalEarnings, 0),
    }))
    .sort((a, b) => b.totalConversions - a.totalConversions)
    .slice(0, 5);

  const conversionRate =
    totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statystyki</h1>
        <p className="text-muted-foreground mt-1">
          Zaawansowane dane o Twojej kampanii afiliacyjnej.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Łączne kliknięcia</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Łączne konwersje</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Współczynnik konwersji</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{conversionRate}%</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top 5 produktów</CardTitle></CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Brak danych.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produkt</TableHead>
                  <TableHead className="text-right">Kliknięcia</TableHead>
                  <TableHead className="text-right">Konwersje</TableHead>
                  <TableHead className="text-right">Prowizje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.totalClicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{p.totalConversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.totalEarnings)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top 5 influencerów</CardTitle></CardHeader>
        <CardContent>
          {topInfluencers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Brak danych.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead className="text-right">Kliknięcia</TableHead>
                  <TableHead className="text-right">Konwersje</TableHead>
                  <TableHead className="text-right">Zarobki</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topInfluencers.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.influencerProfile.displayName}</TableCell>
                    <TableCell className="text-right">{link.totalClicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{link.totalConversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(link.totalEarnings)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ostatnie 10 konwersji</CardTitle></CardHeader>
        <CardContent>
          {recentConversions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Brak konwersji.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Influencer</TableHead>
                  <TableHead className="text-right">Kwota</TableHead>
                  <TableHead className="text-right">Prowizja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConversions.map((conv) => {
                  const s = statusConfig[conv.status];
                  return (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">{conv.affiliateLink.product.name}</TableCell>
                      <TableCell>{conv.affiliateLink.influencerProfile.displayName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(conv.amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(conv.commission)}</TableCell>
                      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(conv.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
