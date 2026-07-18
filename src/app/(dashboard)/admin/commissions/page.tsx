import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllCommissionsAction } from "@/actions/commission.actions";
import { AdminCommissionsClient } from "@/components/admin/AdminCommissionsClient";

export const dynamic = "force-dynamic";

export default async function AdminCommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const { tab } = await searchParams;

  const [result, brands] = await Promise.all([
    getAllCommissionsAction(),
    prisma.brandProfile.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  const commissions = result.success ? result.data ?? [] : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">Komisje</h1>
        <p className="mt-1 text-sm text-slate-500">Wszystkie komisje z platformy.</p>
      </header>

      <AdminCommissionsClient
        commissions={commissions}
        brands={brands}
        initialTab={tab === "suspicious" ? "suspicious" : "all"}
      />
    </div>
  );
}
