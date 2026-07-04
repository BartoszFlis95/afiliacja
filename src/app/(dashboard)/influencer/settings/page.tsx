import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBankDetailsAction } from "@/actions/influencer.actions";
import { SettingsForm } from "@/components/influencer/InfluencerSettingsForm";
import { BankDetailsForm } from "@/components/influencer/BankDetailsForm";
import { ChangePasswordForm } from "@/components/influencer/ChangePasswordForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function InfluencerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const params = await searchParams;
  const defaultTab = params.tab === "bank" ? "bank" : params.tab === "security" ? "security" : "profile";

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

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        <p className="mt-1 text-muted-foreground">Zarządzaj profilem i danymi konta.</p>
      </header>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="bank" className="relative">
            Dane bankowe
            {bankDetails && !bankDetails.hasBankDetails && (
              <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-red-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
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
            <p className="text-sm text-muted-foreground">Nie udało się załadować danych bankowych.</p>
          )}
        </TabsContent>

        <TabsContent value="security">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
