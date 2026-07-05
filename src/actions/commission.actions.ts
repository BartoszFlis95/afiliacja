"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { formatEmailAmount } from "@/emails/utils";
import CommissionApprovedEmail from "@/emails/CommissionApprovedEmail";
import PayoutApprovedEmail from "@/emails/PayoutApprovedEmail";
import PayoutCompletedEmail from "@/emails/PayoutCompletedEmail";
import {
  CommissionStatus,
  PayoutStatus,
  Role,
} from "@prisma/client";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Resolves the session and asserts the caller has the required role.
 * Returns the userId on success, or an error result the action can return as-is.
 */
async function requireRole(role: Role) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Brak autoryzacji." };
  }
  if (session.user.role !== role) {
    return { ok: false as const, error: "Brak uprawnień." };
  }
  return { ok: true as const, userId: session.user.id };
}

async function getBrandProfileId(userId: string) {
  const profile = await prisma.brandProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

async function getInfluencerProfileId(userId: string) {
  const profile = await prisma.influencerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

// ---------------------------------------------------------------------------
// BRAND
// ---------------------------------------------------------------------------

async function approveCommissionCore(commissionId: string): Promise<ActionResult> {
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    select: {
      status: true,
      influencerId: true,
      commissionAmount: true,
      product: { select: { name: true } },
      influencer: {
        select: { displayName: true, user: { select: { email: true } } },
      },
    },
  });

  if (!commission) return { success: false, error: "Nie znaleziono komisji." };
  if (commission.status !== CommissionStatus.PENDING) {
    return { success: false, error: "Komisja nie oczekuje na decyzję." };
  }

  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: CommissionStatus.APPROVED },
  });

  const influencerEmail = commission.influencer.user.email;
  if (influencerEmail) {
    const commissionAmount = Number(commission.commissionAmount);
    // Nie blokuj akcji na wysyłce maila — fire-and-forget, przez after().
    after(() =>
      prisma.commission
        .aggregate({
          where: {
            influencerId: commission.influencerId,
            status: CommissionStatus.APPROVED,
            payout: null,
          },
          _sum: { commissionAmount: true },
        })
        .then((balanceAggregate) =>
          sendEmail({
            to: influencerEmail,
            subject: `✅ Prowizja zatwierdzona! Możesz wypłacić ${formatEmailAmount(commissionAmount)}`,
            react: CommissionApprovedEmail({
              influencerName: commission.influencer.displayName,
              productName: commission.product.name,
              commissionAmount,
              availableBalance: Number(balanceAggregate._sum.commissionAmount ?? 0),
            }),
          })
        )
        .catch((err) => console.error("[email] commission approved failed:", err))
    );
  }

  return { success: true };
}

async function rejectCommissionCore(commissionId: string): Promise<ActionResult> {
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    select: { status: true },
  });

  if (!commission) return { success: false, error: "Nie znaleziono komisji." };
  if (commission.status !== CommissionStatus.PENDING) {
    return { success: false, error: "Komisja nie oczekuje na decyzję." };
  }

  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: CommissionStatus.REJECTED },
  });

  return { success: true };
}

export async function approveCommissionAction(
  commissionId: string
): Promise<ActionResult> {
  const guard = await requireRole("BRAND");
  if (!guard.ok) return { success: false, error: guard.error };

  const brandId = await getBrandProfileId(guard.userId);
  if (!brandId) return { success: false, error: "Nie znaleziono profilu marki." };

  const ownership = await prisma.commission.findUnique({
    where: { id: commissionId },
    select: { brandId: true },
  });
  if (!ownership || ownership.brandId !== brandId) {
    return { success: false, error: "Komisja nie należy do tej marki." };
  }

  const result = await approveCommissionCore(commissionId);
  if (result.success) revalidatePath("/brand/commissions");
  return result;
}

export async function rejectCommissionAction(
  commissionId: string
): Promise<ActionResult> {
  const guard = await requireRole("BRAND");
  if (!guard.ok) return { success: false, error: guard.error };

  const brandId = await getBrandProfileId(guard.userId);
  if (!brandId) return { success: false, error: "Nie znaleziono profilu marki." };

  const ownership = await prisma.commission.findUnique({
    where: { id: commissionId },
    select: { brandId: true },
  });
  if (!ownership || ownership.brandId !== brandId) {
    return { success: false, error: "Komisja nie należy do tej marki." };
  }

  const result = await rejectCommissionCore(commissionId);
  if (result.success) revalidatePath("/brand/commissions");
  return result;
}

// ---------------------------------------------------------------------------
// ADMIN (komisje) — te same przejścia statusów co dla marki, ale bez
// sprawdzania właściciela: admin może interweniować w komisję dowolnej marki.
// ---------------------------------------------------------------------------

export async function adminApproveCommissionAction(
  commissionId: string
): Promise<ActionResult> {
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return { success: false, error: guard.error };

  const result = await approveCommissionCore(commissionId);
  if (result.success) revalidatePath("/admin/commissions");
  return result;
}

export async function adminRejectCommissionAction(
  commissionId: string
): Promise<ActionResult> {
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return { success: false, error: guard.error };

  const result = await rejectCommissionCore(commissionId);
  if (result.success) revalidatePath("/admin/commissions");
  return result;
}

export async function getAllCommissionsAction() {
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return { success: false as const, error: guard.error };

  const commissions = await prisma.commission.findMany({
    include: {
      influencer: { select: { displayName: true } },
      brand: { select: { companyName: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = commissions.map((c) => ({
    ...c,
    orderValue: Number(c.orderValue),
    commissionAmount: Number(c.commissionAmount),
  }));

  return { success: true as const, data: serialized };
}

export async function getBrandCommissionsAction() {
  const guard = await requireRole("BRAND");
  if (!guard.ok) return { success: false as const, error: guard.error };

  const brandId = await getBrandProfileId(guard.userId);
  if (!brandId)
    return { success: false as const, error: "Nie znaleziono profilu marki." };

  const commissions = await prisma.commission.findMany({
    where: { brandId },
    include: {
      influencer: { select: { displayName: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = commissions.map((c) => ({
    ...c,
    orderValue:       Number(c.orderValue),
    commissionAmount: Number(c.commissionAmount),
  }));

  return { success: true as const, data: serialized };
}

// ---------------------------------------------------------------------------
// INFLUENCER
// ---------------------------------------------------------------------------

export async function getInfluencerCommissionsAction() {
  const guard = await requireRole("INFLUENCER");
  if (!guard.ok) return { success: false as const, error: guard.error };

  const influencerId = await getInfluencerProfileId(guard.userId);
  if (!influencerId)
    return {
      success: false as const,
      error: "Nie znaleziono profilu influencera.",
    };

  const commissions = await prisma.commission.findMany({
    where: { influencerId },
    include: {
      product: { select: { name: true } },
      brand: { select: { companyName: true } },
      payout: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = commissions.map((c) => ({
    ...c,
    orderValue:       Number(c.orderValue),
    commissionAmount: Number(c.commissionAmount),
  }));

  return { success: true as const, data: serialized };
}

export async function requestPayoutAction(
  commissionId: string,
  bankAccount: string
): Promise<ActionResult> {
  const guard = await requireRole("INFLUENCER");
  if (!guard.ok) return { success: false, error: guard.error };

  const account = bankAccount?.trim();
  if (!account) {
    return { success: false, error: "Numer konta jest wymagany." };
  }

  const influencerId = await getInfluencerProfileId(guard.userId);
  if (!influencerId)
    return { success: false, error: "Nie znaleziono profilu influencera." };

  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    select: {
      influencerId: true,
      status: true,
      commissionAmount: true,
      payout: { select: { id: true } },
    },
  });

  if (!commission || commission.influencerId !== influencerId) {
    return { success: false, error: "Komisja nie należy do tego influencera." };
  }
  if (commission.status !== CommissionStatus.APPROVED) {
    return {
      success: false,
      error: "Wypłatę można zlecić tylko dla zatwierdzonej komisji.",
    };
  }
  if (commission.payout) {
    return { success: false, error: "Wniosek o wypłatę już istnieje." };
  }

  await prisma.payout.create({
    data: {
      influencerId,
      commissionId,
      amount: commission.commissionAmount,
      bankAccount: account,
      status: PayoutStatus.PENDING,
    },
  });

  revalidatePath("/influencer/commissions");
  return { success: true };
}

// ---------------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------------

export async function adminApprovePayoutAction(
  payoutId: string
): Promise<ActionResult> {
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return { success: false, error: guard.error };

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: {
      status: true,
      amount: true,
      influencer: {
        select: {
          displayName: true,
          bankAccountIban: true,
          paypalEmail: true,
          preferredPayout: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  if (!payout) return { success: false, error: "Nie znaleziono wypłaty." };
  if (payout.status !== PayoutStatus.PENDING) {
    return { success: false, error: "Wypłata nie oczekuje na zatwierdzenie." };
  }

  await prisma.payout.update({
    where: { id: payoutId },
    data: { status: PayoutStatus.PROCESSING },
  });

  revalidatePath("/admin/payouts");

  const influencerEmail = payout.influencer.user.email;
  if (influencerEmail) {
    const amount = Number(payout.amount);
    after(() =>
      sendEmail({
        to: influencerEmail,
        subject: `💸 Wypłata zatwierdzona — ${formatEmailAmount(amount)} w drodze`,
        react: PayoutApprovedEmail({
          influencerName: payout.influencer.displayName,
          amount,
          bankAccount: payout.influencer.bankAccountIban ?? undefined,
          paypalEmail: payout.influencer.paypalEmail ?? undefined,
          preferredPayout: payout.influencer.preferredPayout ?? undefined,
        }),
      }).catch((err) => console.error("[email] payout approved failed:", err))
    );
  }

  return { success: true };
}

export async function adminMarkPayoutPaidAction(
  payoutId: string
): Promise<ActionResult> {
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return { success: false, error: guard.error };

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: {
      status: true,
      commissionId: true,
      amount: true,
      influencer: {
        select: { displayName: true, user: { select: { email: true } } },
      },
    },
  });

  if (!payout) return { success: false, error: "Nie znaleziono wypłaty." };
  if (payout.status !== PayoutStatus.PROCESSING) {
    return { success: false, error: "Wypłata nie jest w trakcie realizacji." };
  }

  // Payout COMPLETED and Commission PAID must flip together.
  await prisma.$transaction([
    prisma.payout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.COMPLETED, processedAt: new Date() },
    }),
    prisma.commission.update({
      where: { id: payout.commissionId, status: CommissionStatus.APPROVED },
      data: { status: CommissionStatus.PAID },
    }),
  ]);

  revalidatePath("/admin/payouts");

  const influencerEmail = payout.influencer.user.email;
  if (influencerEmail) {
    after(() =>
      sendEmail({
        to: influencerEmail,
        subject: `✅ Wypłata zrealizowana — ${formatEmailAmount(Number(payout.amount))} wysłane!`,
        react: PayoutCompletedEmail({
          influencerName: payout.influencer.displayName,
          amount: Number(payout.amount),
          referenceNumber: payoutId,
        }),
      }).catch((err) => console.error("[email] payout completed failed:", err))
    );
  }

  return { success: true };
}
