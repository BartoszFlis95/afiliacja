// src/app/(dashboard)/brand/influencers/page.tsx
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type InfluencerRow = {
  influencerProfileId: string;
  displayName: string;
  productCount: number;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
};

export default async function BrandInfluencersPage() {
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

  const links = await prisma.affiliateLink.findMany({
    where: { product: { brandProfileId: brandProfile.id } },
    include: { influencerProfile: true },
  });

  // Grupowanie po influencerze w pamięci — jeden influencer może mieć
  // wiele linków (po jednym na produkt).
  const grouped = new Map<string, InfluencerRow>();

  for (const link of links) {
    const profile = link.influencerProfile;
    if (!profile) continue;

    const current =
      grouped.get(profile.id) ??
      ({
        influencerProfileId: profile.id,
        displayName: profile.displayName,
        productCount: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalEarnings: 0,
      } satisfies InfluencerRow);

    current.productCount += 1;
    current.totalClicks += link.totalClicks;
    current.totalConversions += link.totalConversions;
    current.totalEarnings += Number(link.totalEarnings);

    grouped.set(profile.id, current);
  }

  const rows = Array.from(grouped.values()).sort(
    (a, b) => b.totalEarnings - a.totalEarnings,
  );

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Influencerzy</h1>
        <p className="mt-1 text-muted-foreground">
          {rows.length.toLocaleString("pl-PL")} partnerów promujących Twoje produkty.
        </p>
      </header>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Influencer</TableHead>
              <TableHead className="text-right">Produkty</TableHead>
              <TableHead className="text-right">Kliknięcia</TableHead>
              <TableHead className="text-right">Konwersje</TableHead>
              <TableHead className="text-right">Zarobki</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Żaden influencer nie promuje jeszcze Twoich produktów.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.influencerProfileId}>
                  <TableCell className="font-medium">{row.displayName}</TableCell>
                  <TableCell className="text-right">
                    {row.productCount.toLocaleString("pl-PL")}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.totalClicks.toLocaleString("pl-PL")}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.totalConversions.toLocaleString("pl-PL")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.totalEarnings)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
