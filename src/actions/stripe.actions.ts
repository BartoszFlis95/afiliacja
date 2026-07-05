"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAppUrl, sendEmail } from "@/lib/resend";
import { formatEmailAmount } from "@/emails/utils";
import PayoutCompletedEmail from "@/emails/PayoutCompletedEmail";
import { CommissionStatus, PayoutStatus } from "@prisma/client";
import type { StripeAccountStatus, StripeConnectStatus } from "@/types";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

async function requireInfluencer() {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") return null;
  return session;
}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return null;
  return session;
}

export async function createStripeAccountAction(): Promise<
  ActionResult<{ accountId: string }>
> {
  const session = await requireInfluencer();
  if (!session?.user?.id) return { success: false, error: "Brak autoryzacji" };

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, stripeAccountId: true },
  });
  if (!profile) return { success: false, error: "Profil nie istnieje" };

  if (profile.stripeAccountId) {
    return { success: true, data: { accountId: profile.stripeAccountId } };
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "PL",
      email: session.user.email ?? undefined,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      settings: {
        payouts: { schedule: { interval: "manual" } },
      },
    });

    await prisma.influencerProfile.update({
      where: { id: profile.id },
      data: { stripeAccountId: account.id, stripeAccountStatus: "pending" },
    });

    revalidatePath("/influencer/settings");
    return { success: true, data: { accountId: account.id } };
  } catch (err) {
    console.error("[stripe] create account failed:", err);
    return { success: false, error: "Nie udało się utworzyć konta Stripe." };
  }
}

export async function createStripeOnboardingLinkAction(): Promise<
  ActionResult<{ url: string }>
> {
  const session = await requireInfluencer();
  if (!session?.user?.id) return { success: false, error: "Brak autoryzacji" };

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { stripeAccountId: true },
  });
  if (!profile) return { success: false, error: "Profil nie istnieje" };

  let accountId = profile.stripeAccountId;
  if (!accountId) {
    const created = await createStripeAccountAction();
    if (!created.success || !created.data) {
      return {
        success: false,
        error: created.error ?? "Nie udało się utworzyć konta Stripe.",
      };
    }
    accountId = created.data.accountId;
  }

  try {
    const appUrl = getAppUrl();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/influencer/settings?tab=stripe&refresh=true`,
      return_url: `${appUrl}/influencer/settings?tab=stripe&success=true`,
      type: "account_onboarding",
    });
    return { success: true, data: { url: link.url } };
  } catch (err) {
    console.error("[stripe] create onboarding link failed:", err);
    return { success: false, error: "Nie udało się wygenerować linku onboardingu." };
  }
}

export async function getStripeAccountStatusAction(): Promise<
  ActionResult<StripeConnectStatus>
> {
  const session = await requireInfluencer();
  if (!session?.user?.id) return { success: false, error: "Brak autoryzacji" };

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, stripeAccountId: true },
  });
  if (!profile) return { success: false, error: "Profil nie istnieje" };

  if (!profile.stripeAccountId) {
    return {
      success: true,
      data: {
        status: "not_connected",
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingDone: false,
      },
    };
  }

  try {
    const account = await stripe.accounts.retrieve(profile.stripeAccountId);
    const chargesEnabled = !!account.charges_enabled;
    const payoutsEnabled = !!account.payouts_enabled;
    const requirements = account.requirements;
    const needsAction =
      (requirements?.currently_due?.length ?? 0) > 0 ||
      (requirements?.past_due?.length ?? 0) > 0 ||
      !!requirements?.disabled_reason;
    const onboardingDone = chargesEnabled && payoutsEnabled;

    let status: StripeAccountStatus;
    if (onboardingDone) {
      status = "active";
    } else if (needsAction) {
      status = "restricted";
    } else {
      status = "pending";
    }

    await prisma.influencerProfile.update({
      where: { id: profile.id },
      data: { stripeAccountStatus: status, stripeOnboardingDone: onboardingDone },
    });

    return {
      success: true,
      data: {
        status,
        accountId: profile.stripeAccountId,
        chargesEnabled,
        payoutsEnabled,
        onboardingDone,
      },
    };
  } catch (err) {
    console.error("[stripe] get account status failed:", err);
    return { success: false, error: "Nie udało się pobrać statusu konta Stripe." };
  }
}

export async function getStripeExpressDashboardLinkAction(): Promise<
  ActionResult<{ url: string }>
> {
  const session = await requireInfluencer();
  if (!session?.user?.id) return { success: false, error: "Brak autoryzacji" };

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { stripeAccountId: true },
  });
  if (!profile?.stripeAccountId) {
    return { success: false, error: "Konto Stripe nie jest połączone." };
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(profile.stripeAccountId);
    return { success: true, data: { url: loginLink.url } };
  } catch (err) {
    console.error("[stripe] create login link failed:", err);
    return { success: false, error: "Nie udało się otworzyć panelu Stripe." };
  }
}

// ---------------------------------------------------------------------------
// ADMIN — realny transfer środków. Idempotentny: nie wykona drugiego transferu
// dla tej samej wypłaty, i nigdy nie transferuje na konto bez ukończonego
// onboardingu Stripe.
// ---------------------------------------------------------------------------
export async function executeStripeTransferAction(
  payoutId: string
): Promise<ActionResult<{ transferId: string }>> {
  const session = await requireAdmin();
  if (!session?.user?.id) return { success: false, error: "Brak uprawnień." };

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: {
      id: true,
      status: true,
      amount: true,
      commissionId: true,
      stripeTransferId: true,
      influencerId: true,
      influencer: {
        select: {
          displayName: true,
          stripeAccountId: true,
          stripeOnboardingDone: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  if (!payout) return { success: false, error: "Nie znaleziono wypłaty." };

  // Idempotencja — jeśli transfer już wykonany, nie próbuj ponownie.
  if (payout.stripeTransferId) {
    return { success: true, data: { transferId: payout.stripeTransferId } };
  }

  if (payout.status !== PayoutStatus.PROCESSING) {
    return { success: false, error: "Wypłata nie jest w trakcie realizacji." };
  }

  if (!payout.influencer.stripeAccountId || !payout.influencer.stripeOnboardingDone) {
    return {
      success: false,
      error: "Influencer nie ukończył onboardingu Stripe — wymagany ręczny przelew.",
    };
  }

  const amount = Number(payout.amount);
  let transferId: string;
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: "pln",
      destination: payout.influencer.stripeAccountId,
      transfer_group: `payout_${payoutId}`,
      metadata: { payoutId, influencerId: payout.influencerId },
    });
    transferId = transfer.id;
  } catch (err) {
    console.error("[stripe] transfer failed:", err);
    return { success: false, error: "Nie udało się wykonać transferu Stripe." };
  }

  // Payout COMPLETED i Commission PAID muszą przełączyć się razem — tak samo
  // jak przy ręcznym adminMarkPayoutPaidAction.
  await prisma.$transaction([
    prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.COMPLETED,
        processedAt: new Date(),
        stripeTransferId: transferId,
        payoutMethod: "stripe",
      },
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
        subject: `✅ Wypłata zrealizowana — ${formatEmailAmount(amount)} wysłane!`,
        react: PayoutCompletedEmail({
          influencerName: payout.influencer.displayName,
          amount,
          referenceNumber: transferId,
        }),
      }).catch((err) => console.error("[email] payout completed (stripe) failed:", err))
    );
  }

  return { success: true, data: { transferId } };
}
