// src/app/(dashboard)/influencer/settings/page.tsx
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/influencer/InfluencerSettingsForm";

export const dynamic = "force-dynamic";

export default async function InfluencerSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    redirect("/influencer/onboarding");
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        <p className="mt-1 text-muted-foreground">
          Zaktualizuj dane swojego profilu.
        </p>
      </header>

      <SettingsForm
        profile={{
          displayName: profile.displayName,
          bio: profile.bio,
          website: profile.website,
          instagramUrl: profile.instagramUrl,
          youtubeUrl: profile.youtubeUrl,
          tiktokUrl: profile.tiktokUrl,
          followersCount: profile.followersCount,
        }}
      />
    </div>
  );
}
