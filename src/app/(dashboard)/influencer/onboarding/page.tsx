import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/influencer/InfluencerOnboardingForm";

export const dynamic = "force-dynamic";

export default async function InfluencerOnboardingPage() {
  const session = await auth();

  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const existing = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (existing) {
    redirect("/influencer/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Witaj w Deneeu</h1>
        <p className="mt-1 text-muted-foreground">
          Uzupełnij profil, aby zacząć promować produkty i zarabiać prowizje.
        </p>
      </header>

      <OnboardingForm />
    </div>
  );
}