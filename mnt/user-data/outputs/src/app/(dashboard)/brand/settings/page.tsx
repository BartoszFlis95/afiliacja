import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BrandProfileForm } from "@/components/brand/BrandProfileForm";

export default async function BrandSettingsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) redirect("/brand/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-muted-foreground mt-1">Zarządzaj profilem swojej marki.</p>
      </div>
      <BrandProfileForm
        initialData={{
          companyName: brandProfile.companyName,
          industry: brandProfile.industry ?? undefined,
          website: brandProfile.website ?? undefined,
          description: brandProfile.description ?? undefined,
        }}
      />
    </div>
  );
}
