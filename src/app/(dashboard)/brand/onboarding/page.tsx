// src/app/(dashboard)/brand/onboarding/page.tsx
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandOnboardingForm } from "@/components/brand/BrandOnboardingForm";

export const dynamic = "force-dynamic";

export default async function BrandOnboardingPage() {
  const session = await auth();

  if (session?.user?.role !== "BRAND") {
    redirect("/login");
  }

  const existing = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (existing) {
    redirect("/brand/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Witaj w Deneeu</h1>
        <p className="mt-1 text-muted-foreground">
          Uzupełnij profil marki, aby zacząć dodawać produkty.
        </p>
      </header>

      <BrandOnboardingForm />
    </div>
  );
}
