// src/app/(dashboard)/brand/influencers/page.tsx
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandInfluencersClient, type InfluencerRow } from "@/components/brand/BrandInfluencersClient";

export const dynamic = "force-dynamic";

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
        avatarUrl: profile.avatarUrl,
        instagramUrl: profile.instagramUrl,
        youtubeUrl: profile.youtubeUrl,
        tiktokUrl: profile.tiktokUrl,
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

  const rows = Array.from(grouped.values()).sort((a, b) => b.totalEarnings - a.totalEarnings);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Influencerzy</h1>
        <p className="mt-1 text-muted-foreground">
          {rows.length.toLocaleString("pl-PL")} partnerów promujących Twoje produkty.
        </p>
      </header>

      <BrandInfluencersClient rows={rows} />
    </div>
  );
}
