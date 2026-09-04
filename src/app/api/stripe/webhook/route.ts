export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { formatEmailAmount } from "@/emails/utils";
import AdminTransferFailedEmail from "@/emails/AdminTransferFailedEmail";
import { CommissionStatus, ConversionStatus, PayoutStatus } from "@prisma/client";
import { syncConversionStatus } from "@/lib/conversions";
import type { StripeAccountStatus } from "@/types";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
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

        await prisma.influencerProfile.updateMany({
          where: { stripeAccountId: account.id },
          data: { stripeAccountStatus: status, stripeOnboardingDone: onboardingDone },
        });
        break;
      }

      case "transfer.created": {
        // Zdarzenie potwierdzające, że transfer ruszył. Stan wypłaty zmienia
        // dopiero transfer.paid / transfer.failed, więc tu nie ma czego robić —
        // gałąź istnieje po to, by zdarzenie nie trafiło do "nieobsłużone".
        break;
      }

      // "transfer.failed" nie istnieje już w API Stripe — transfery między
      // saldami odrzucane są synchronicznie przy tworzeniu (obsłużone w
      // try/catch w executeStripeTransferAction). "transfer.reversed" to
      // najbliższy odpowiednik problemu wykrytego już po fakcie.
      case "transfer.reversed": {
        const transfer = event.data.object as Stripe.Transfer;

        const payout = await prisma.payout.findFirst({
          where: { stripeTransferId: transfer.id },
          select: {
            id: true,
            amount: true,
            status: true,
            commissionId: true,
            commission: { select: { affiliateLinkId: true, orderId: true } },
            influencer: { select: { displayName: true } },
          },
        });

        // Stripe ponawia webhooki aż do odpowiedzi 2xx, więc to samo zdarzenie
        // potrafi przyjść kilka razy. Sam update jest idempotentny, ale wysyłka
        // maili już nie — bez tego warunku każde ponowienie zasypywało adminów
        // kolejnym alertem o tym samym transferze.
        if (payout && payout.status !== PayoutStatus.REJECTED) {
          /**
           * Cofnięcie transferu musi cofnąć CAŁY łańcuch statusów.
           *
           * Wcześniej zmieniał się tylko Payout, a Commission i Conversion
           * zostawały na PAID — system twierdził, że pieniądze zostały
           * wypłacone, choć Stripe je odzyskał. Skutki były dwa: influencer
           * widział prowizję jako wypłaconą, a raporty finansowe liczyły ją
           * jako koszt.
           *
           * Wszystko w jednej transakcji: rozjazd między tymi trzema statusami
           * jest gorszy niż nieudany zapis, bo nic go nie zgłosi.
           */
          await prisma.$transaction([
            prisma.payout.update({
              where: { id: payout.id },
              data: { status: PayoutStatus.REJECTED },
            }),
            prisma.commission.update({
              where: { id: payout.commissionId },
              data: { status: CommissionStatus.APPROVED },
            }),
          ]);

          // Conversion wraca do CONFIRMED — prowizja jest znów zatwierdzona,
          // ale niewypłacona.
          await syncConversionStatus(
            payout.commission.affiliateLinkId,
            payout.commission.orderId,
            ConversionStatus.CONFIRMED,
          );

          const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { email: true },
          });

          const amount = Number(payout.amount);
          for (const admin of admins) {
            sendEmail({
              to: admin.email,
              subject: `⚠️ Transfer Stripe nie powiódł się — ${formatEmailAmount(amount)}`,
              react: AdminTransferFailedEmail({
                influencerName: payout.influencer.displayName,
                amount,
                transferId: transfer.id,
              }),
            }).catch((err) =>
              console.error("[email] admin transfer failed alert error:", err)
            );
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
