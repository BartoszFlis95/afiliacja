import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandProfileForm } from "@/components/brand/BrandProfileForm";
import { WebhookSection } from "@/components/brand/WebhookSection";

export const dynamic = "force-dynamic";

export default async function BrandSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) {
    redirect("/brand/onboarding");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        <p className="mt-1 text-muted-foreground">
          Zarządzaj danymi profilu i integracją ze sklepem.
        </p>
      </header>

      <BrandProfileForm profile={brandProfile} />

      <WebhookSection
        apiKey={brandProfile.apiKey}
        webhookSecret={brandProfile.webhookSecret}
      />
    </div>
  );
}
