import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default async function BrandInfluencersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) redirect("/brand/onboarding");

  const affiliateLinks = await prisma.affiliateLink.findMany({
    where: { product: { brandProfileId: brandProfile.id } },
    include: {
      influencerProfile: true,
      product: { select: { id: true, name: true } },
    },
  });

  const influencerMap = new Map<
    string,
    {
      influencerProfile: (typeof affiliateLinks)[0]["influencerProfile"];
      products: string[];
      totalClicks: number;
      totalConversions: number;
      totalEarnings: number;
    }
  >();

  for (const link of affiliateLinks) {
    const pid = link.influencerProfileId;
    const existing = influencerMap.get(pid);
    if (existing) {
      existing.products.push(link.product.name);
      existing.totalClicks += link.totalClicks;
      existing.totalConversions += link.totalConversions;
      existing.totalEarnings += link.totalEarnings;
    } else {
      influencerMap.set(pid, {
        influencerProfile: link.influencerProfile,
        products: [link.product.name],
        totalClicks: link.totalClicks,
        totalConversions: link.totalConversions,
        totalEarnings: link.totalEarnings,
      });
    }
  }

  const influencers = Array.from(influencerMap.values()).sort(
    (a, b) => b.totalEarnings - a.totalEarnings
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Influencerzy</h1>
        <p className="text-muted-foreground mt-1">
          Influencerzy promujący produkty Twojej marki.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wszyscy influencerzy ({influencers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {influencers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Żaden influencer nie promuje jeszcze Twoich produktów.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Promowane produkty</TableHead>
                  <TableHead className="text-right">Kliknięcia</TableHead>
                  <TableHead className="text-right">Konwersje</TableHead>
                  <TableHead className="text-right">Zarobki</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencers.map(({ influencerProfile, products, totalClicks, totalConversions, totalEarnings }) => (
                  <TableRow key={influencerProfile.id}>
                    <TableCell className="font-medium">{influencerProfile.displayName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {products.join(", ")}
                    </TableCell>
                    <TableCell className="text-right">{totalClicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{totalConversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalEarnings)}</TableCell>
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
