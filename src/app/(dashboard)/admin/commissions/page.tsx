import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllCommissionsAction } from "@/actions/commission.actions";
import { AdminCommissionsClient } from "@/components/admin/AdminCommissionsClient";

export const dynamic = "force-dynamic";

export default async function AdminCommissionsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

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
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Komisje</h1>
        <p className="mt-1 text-sm text-zinc-500">Wszystkie komisje z platformy.</p>
      </header>

      <AdminCommissionsClient commissions={commissions} brands={brands} />
    </div>
  );
}
