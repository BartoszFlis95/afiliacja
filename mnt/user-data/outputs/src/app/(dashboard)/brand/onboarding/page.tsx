import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BrandOnboardingForm } from "@/components/brand/BrandOnboardingForm";

export default async function BrandOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    redirect("/login");
  }

  const existing = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (existing) {
    redirect("/brand/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Witaj w Deneeu!</h1>
        <p className="text-muted-foreground mt-2">
          Skonfiguruj profil swojej marki, aby rozpocząć.
        </p>
      </div>
      <BrandOnboardingForm />
    </div>
  );
}
