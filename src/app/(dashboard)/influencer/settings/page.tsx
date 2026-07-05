import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBankDetailsAction } from "@/actions/influencer.actions";
import { SettingsForm } from "@/components/influencer/InfluencerSettingsForm";
import { BankDetailsForm } from "@/components/influencer/BankDetailsForm";
import { BillingTypeForm } from "@/components/influencer/BillingTypeForm";
import { ChangePasswordForm } from "@/components/influencer/ChangePasswordForm";
import { StripeConnectSection } from "@/components/influencer/StripeConnectSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { StripeAccountStatus, StripeConnectStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function InfluencerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string; refresh?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const params = await searchParams;
  const validTabs = ["profile", "bank", "billing", "stripe", "security"];
  const defaultTab = validTabs.includes(params.tab ?? "") ? params.tab! : "profile";

  const [profile, bankResult] = await Promise.all([
    prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
    }),
    getBankDetailsAction(),
  ]);

  if (!profile) {
    redirect("/influencer/onboarding");
  }

  const bankDetails = bankResult.success ? bankResult.data! : null;
  const hasBankDetails = bankDetails?.hasBankDetails ?? false;

  const stripeStatus: StripeConnectStatus = {
    status: !profile.stripeAccountId
      ? "not_connected"
      : ((profile.stripeAccountStatus as StripeAccountStatus | null) ?? "pending"),
    accountId: profile.stripeAccountId,
    chargesEnabled: profile.stripeOnboardingDone,
    payoutsEnabled: profile.stripeOnboardingDone,
    onboardingDone: profile.stripeOnboardingDone,
  };
  const stripeAutoRefresh = params.success === "true" || params.refresh === "true";

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-5 sm:space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">Ustawienia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zarządzaj profilem i danymi konta.
        </p>
      </header>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex h-auto flex-wrap gap-1 p-1 mb-5 sm:mb-6 sm:grid sm:grid-cols-5">
          <TabsTrigger
            value="profile"
            className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"
          >
            Profil
          </TabsTrigger>

          <TabsTrigger
            value="bank"
            className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"
          >
            Dane bankowe
            {!hasBankDetails && (
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
            )}
          </TabsTrigger>

          <TabsTrigger
            value="billing"
            className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"
          >
            Rozliczenia
          </TabsTrigger>

          <TabsTrigger
            value="stripe"
            className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"
          >
            Stripe
            {!profile.stripeOnboardingDone && (
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
            )}
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"
          >
            Bezpieczeństwo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <SettingsForm
            profile={{
              displayName: profile.displayName,
              bio: profile.bio,
              website: profile.website,
              instagramUrl: profile.instagramUrl,
              youtubeUrl: profile.youtubeUrl,
              tiktokUrl: profile.tiktokUrl,
              followersCount: profile.followersCount ?? 0,
            }}
          />
        </TabsContent>

        <TabsContent value="bank">
          {bankDetails ? (
            <BankDetailsForm initial={bankDetails} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nie udało się załadować danych bankowych.
            </p>
          )}
        </TabsContent>

        <TabsContent value="billing">
          <BillingTypeForm />
        </TabsContent>

        <TabsContent value="stripe">
          <StripeConnectSection initialStatus={stripeStatus} autoRefresh={stripeAutoRefresh} />
        </TabsContent>

        <TabsContent value="security">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
