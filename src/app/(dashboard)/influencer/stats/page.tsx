import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInfluencerRangeStatsAction } from "@/actions/influencer.actions";
import { InfluencerStatsClient } from "@/components/influencer/InfluencerStatsClient";

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

  const result = await getInfluencerRangeStatsAction(30);
  const initialData = result.success && result.data
    ? result.data
    : { dailyClicks: [], earningsByProduct: [], links: [] };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Statystyki</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Szczegółowy obraz Twoich wyników.
        </p>
      </header>

      <InfluencerStatsClient initialData={initialData} />
    </div>
  );
}
