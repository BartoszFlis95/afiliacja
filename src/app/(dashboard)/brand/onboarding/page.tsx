// src/app/(dashboard)/brand/onboarding/page.tsx
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandOnboardingForm } from "@/components/brand/BrandOnboardingForm";
import { OnboardingChecklist, type OnboardingStep } from "@/components/shared/OnboardingChecklist";

export const dynamic = "force-dynamic";

export default async function BrandOnboardingPage() {
  const session = await auth();

  if (session?.user?.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!brandProfile) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Witaj w Deneeu</h1>
          <p className="mt-1 text-muted-foreground">
            Uzupełnij profil marki, aby zacząć dodawać produkty.
          </p>
        </header>

        <BrandOnboardingForm />
      </div>
    );
  }

  const [productCount, influencerLinkCount] = await Promise.all([
    prisma.product.count({ where: { brandProfileId: brandProfile.id } }),
    prisma.affiliateLink.count({
      where: { product: { brandProfileId: brandProfile.id } },
    }),
  ]);

  const steps: OnboardingStep[] = [
    {
      label: "Uzupełnij profil firmy",
      done: true,
      href: "/brand/settings",
      cta: "Edytuj profil",
    },
    {
      label: "Dodaj pierwszy produkt",
      done: productCount > 0,
      href: "/brand/products/new",
      cta: "Dodaj produkt",
    },
    {
      label: "Skonfiguruj webhook (klucz API)",
      done: brandProfile.apiKey !== null,
      href: "/brand/settings",
      cta: "Zobacz klucz API",
    },
    {
      label: "Zaproś influencera do promowania produktu",
      done: influencerLinkCount > 0,
      href: "/brand/products",
      cta: "Udostępnij produkty",
    },
  ];

  const allDone = steps.every((s) => s.done);

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Witaj w Deneeu, {brandProfile.companyName}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          {allDone
            ? "Wszystko gotowe — Twój program afiliacyjny jest w pełni skonfigurowany."
            : "Ukończ poniższe kroki, aby w pełni uruchomić program afiliacyjny."}
        </p>
      </header>

      <OnboardingChecklist steps={steps} dashboardHref="/brand/dashboard" />
    </div>
  );
}
