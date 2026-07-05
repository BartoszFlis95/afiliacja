import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPayoutsClient, type AdminPayoutRow } from "@/components/admin/AdminPayoutsClient";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const payouts = await prisma.payout.findMany({
    include: {
      influencer: { include: { user: { select: { email: true } } } },
      commission: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: AdminPayoutRow[] = payouts.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    status: p.status,
    bankAccount: p.bankAccount,
    payoutMethod: p.payoutMethod,
    requestedAt: p.requestedAt.toISOString(),
    processedAt: p.processedAt ? p.processedAt.toISOString() : null,
    influencer: {
      displayName: p.influencer.displayName,
      avatarUrl: p.influencer.avatarUrl,
      email: p.influencer.user.email,
      bankAccountIban: p.influencer.bankAccountIban,
      bankAccountBank: p.influencer.bankAccountBank,
      bankAccountName: p.influencer.bankAccountName,
      bankSwift: p.influencer.bankSwift,
      paypalEmail: p.influencer.paypalEmail,
      preferredPayout: p.influencer.preferredPayout,
      stripeOnboardingDone: p.influencer.stripeOnboardingDone,
    },
    commission: p.commission
      ? {
          productName: p.commission.product?.name ?? "—",
          orderValue: Number(p.commission.orderValue),
          commissionAmount: Number(p.commission.commissionAmount),
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Wypłaty</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Zatwierdzaj wnioski i oznaczaj zrealizowane przelewy.
        </p>
      </header>

      <AdminPayoutsClient payouts={rows} />
    </div>
  );
}
