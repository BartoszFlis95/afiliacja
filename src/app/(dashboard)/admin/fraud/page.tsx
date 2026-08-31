import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getFraudLogsAction } from "@/actions/admin.actions";
import { AdminFraudClient } from "@/components/admin/AdminFraudClient";

export const dynamic = "force-dynamic";

export default async function AdminFraudPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const logs = await getFraudLogsAction();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">Fraud detection</h1>
        <p className="mt-1 text-sm text-slate-500">
          Historia zdarzeń wykrytych przez systemy anty-fraudowe platformy.
        </p>
      </header>

      <AdminFraudClient logs={logs} />
    </div>
  );
}
