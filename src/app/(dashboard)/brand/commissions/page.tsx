import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBrandCommissionsAction } from "@/actions/commission.actions";
import { BrandCommissionsClient } from "@/components/brand/BrandCommissionsClient";

export const dynamic = "force-dynamic";

export default async function BrandCommissionsPage() {
  const session = await auth();
  if (session?.user?.role !== "BRAND") {
    redirect("/brand/dashboard");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const [result, products] = await Promise.all([
    getBrandCommissionsAction(),
    brandProfile
      ? prisma.product.findMany({
          where: { brandProfileId: brandProfile.id },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const commissions = result.success ? result.data ?? [] : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Komisje</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Zatwierdzaj lub odrzucaj prowizje influencerów.
        </p>
      </header>

      <BrandCommissionsClient commissions={commissions} products={products} />
    </div>
  );
}
