import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getInviteCodesAction } from "@/actions/admin.actions";
import { AdminInviteCodesClient } from "@/components/admin/AdminInviteCodesClient";

export const dynamic = "force-dynamic";

export default async function AdminInviteCodesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const codes = await getInviteCodesAction();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Kody zaproszeń</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rejestracja marek wymaga aktywnego kodu zaproszenia. Wygeneruj kod i
          wyślij link marce — influencerzy rejestrują się bez kodu.
        </p>
      </header>

      <AdminInviteCodesClient codes={codes} />
    </div>
  );
}
