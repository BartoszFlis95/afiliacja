import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/influencer/InfluencerOnboardingForm";
import { OnboardingChecklist, type OnboardingStep } from "@/components/shared/OnboardingChecklist";

export const dynamic = "force-dynamic";

export default async function InfluencerOnboardingPage() {
  const session = await auth();

  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const influencerProfile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      displayName: true,
      preferredPayout: true,
      bankAccountIban: true,
      paypalEmail: true,
    },
  });

  if (!influencerProfile) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Witaj w Deneeu</h1>
          <p className="mt-1 text-muted-foreground">
            Uzupełnij profil, aby zacząć promować produkty i zarabiać prowizje.
          </p>
        </header>

        <OnboardingForm />
      </div>
    );
  }

  const hasBankDetails =
    (influencerProfile.preferredPayout === "bank" && !!influencerProfile.bankAccountIban) ||
    (influencerProfile.preferredPayout === "paypal" && !!influencerProfile.paypalEmail);

  const affiliateLinkCount = await prisma.affiliateLink.count({
    where: { influencerProfileId: influencerProfile.id },
  });

  const steps: OnboardingStep[] = [
    {
      label: "Uzupełnij profil",
      done: true,
      href: "/influencer/settings",
      cta: "Edytuj profil",
    },
    {
      label: "Dodaj dane bankowe",
      done: hasBankDetails,
      href: "/influencer/settings?tab=bank",
      cta: "Uzupełnij dane",
    },
    {
      label: "Wybierz produkt",
      done: affiliateLinkCount > 0,
      href: "/influencer/products",
      cta: "Przeglądaj produkty",
    },
    {
      label: "Wygeneruj link afiliacyjny",
      done: affiliateLinkCount > 0,
      href: "/influencer/links",
      cta: "Zobacz linki",
    },
  ];

  const allDone = steps.every((s) => s.done);

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Witaj w Deneeu, {influencerProfile.displayName}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          {allDone
            ? "Wszystko gotowe — możesz zarabiać na promowaniu produktów."
            : "Ukończ poniższe kroki, aby zacząć promować produkty i zarabiać prowizje."}
        </p>
      </header>

      <OnboardingChecklist steps={steps} dashboardHref="/influencer/dashboard" />
    </div>
  );
}
