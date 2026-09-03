export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getBillingOverviewAction } from "@/actions/invoice.actions";
import { AdminBillingClient } from "@/components/admin/AdminBillingClient";
import { nazwaMiesiaca } from "@/lib/rozliczenia";

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const teraz = new Date();

  // Domyślnie POPRZEDNI miesiąc: rozliczamy okres zamknięty, a nie trwający.
  const domyslny = new Date(teraz.getFullYear(), teraz.getMonth() - 1, 1);
  const month = Number(params.month) || domyslny.getMonth() + 1;
  const year = Number(params.year) || domyslny.getFullYear();

  const wynik = await getBillingOverviewAction(month, year);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Rozliczenia</h1>
        <p className="mt-1 text-muted-foreground">
          Faktury zbiorcze za {nazwaMiesiaca(month)} {year}. Opłacenie faktury
          odblokowuje wypłaty influencerów z tego okresu.
        </p>
      </header>

      {wynik.success ? (
        <AdminBillingClient pozycje={wynik.data ?? []} month={month} year={year} />
      ) : (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {wynik.error}
        </p>
      )}
    </div>
  );
}
