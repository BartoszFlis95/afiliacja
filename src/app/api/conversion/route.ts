export const dynamic = "force-dynamic";

import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCommissionSplit } from "@/lib/commission";
import { sendEmail } from "@/lib/resend";
import { formatEmailAmount } from "@/emails/utils";
import NewCommissionEmail from "@/emails/NewCommissionEmail";
import CommissionPendingBrandEmail from "@/emails/CommissionPendingBrandEmail";
import { CommissionStatus } from "@prisma/client";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const signature = request.headers.get("x-signature");

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing x-api-key header" },
        { status: 401 }
      );
    }

    const brand = await prisma.brandProfile.findUnique({
      where: { apiKey },
      include: { user: { select: { email: true } } },
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401 }
      );
    }

    const body = await request.text();

    // HMAC jest teraz WYMAGANY, nie opcjonalny — wcześniej brak nagłówka
    // x-signature po prostu pomijał weryfikację, więc jedynym realnym
    // sekretem był apiKey (widoczny np. w konfiguracji integracji marki).
    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing x-signature header" },
        { status: 401 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", brand.webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { success: false, error: "Invalid HMAC signature" },
        { status: 401 }
      );
    }

    const data = JSON.parse(body);
    const { orderId, amount, ref, currency = "PLN", email, productSlug } = data;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId jest wymagany" },
        { status: 400 }
      );
    }

    if (!amount || !ref) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: amount, ref" },
        { status: 400 }
      );
    }

    // Scope po marce (brand.id z apiKey, ustalony wyżej) — orderId pochodzi
    // z systemu marki i różne marki mogą używać tych samych, np.
    // sekwencyjnych numerów zamówień. Bez tego scope'a marka B z tym samym
    // orderId co marka A dostawała fałszywe 409 i traciła konwersję.
    const [existingConversion, existingCommission] = await Promise.all([
      prisma.conversion.findFirst({
        where: {
          orderId: String(orderId),
          affiliateLink: { product: { brandProfileId: brand.id } },
        },
      }),
      prisma.commission.findFirst({
        where: { orderId: String(orderId), brandId: brand.id },
      }),
    ]);

    if (existingConversion || existingCommission) {
      return NextResponse.json(
        { success: false, error: "Order already registered" },
        { status: 409 }
      );
    }

    const links = await prisma.affiliateLink.findMany({
      where: {
        influencerProfileId: String(ref),
        product: {
          brandProfileId: brand.id,
          ...(productSlug ? { slug: productSlug as string } : {}),
        },
      },
      include: {
        product: true,
        influencerProfile: { include: { user: { select: { email: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    if (links.length === 0) {
      return NextResponse.json(
        { success: false, error: "No affiliate link found for this ref" },
        { status: 404 }
      );
    }

    const link = links[0];
    const orderAmount = Number(amount);
    const totalCommissionRate = Number(link.product.commissionRate);
    const influencerRate = Number(link.product.influencerCommissionRate);

    const { totalCommission, influencerCommission, platformCommission } =
      calculateCommissionSplit(orderAmount, totalCommissionRate, influencerRate);

    await prisma.$transaction([
      prisma.conversion.create({
        data: {
          affiliateLinkId:      link.id,
          orderId:              String(orderId),
          amount:               orderAmount,
          commission:           totalCommission,
          influencerCommission,
          platformCommission,
          status:               "PENDING",
          customerEmail:        email ?? null,
        },
      }),
      // BUG-02: create Commission record so Brand can approve and Influencer can request Payout
      prisma.commission.create({
        data: {
          influencerId:      link.influencerProfileId,
          brandId:           brand.id,
          productId:         link.productId,
          affiliateLinkId:   link.id,
          orderId:           String(orderId),
          orderValue:        orderAmount,
          commissionPercent: influencerRate,
          commissionAmount:  influencerCommission,
          status:            CommissionStatus.PENDING,
        },
      }),
      prisma.affiliateLink.update({
        where: { id: link.id },
        data: {
          totalConversions: { increment: 1 },
          totalEarnings:    { increment: influencerCommission },
        },
      }),
    ]);

    // Nie blokuj odpowiedzi webhooka na wysyłce maili — fire-and-forget, przez after().
    const influencerEmail = link.influencerProfile.user.email;
    if (influencerEmail) {
      after(() =>
        sendEmail({
          to: influencerEmail,
          subject: `🎉 Nowa prowizja! +${formatEmailAmount(influencerCommission)}`,
          react: NewCommissionEmail({
            influencerName: link.influencerProfile.displayName,
            productName: link.product.name,
            brandName: brand.companyName,
            orderValue: orderAmount,
            commissionAmount: influencerCommission,
            commissionPercent: influencerRate,
          }),
        }).catch((err) => console.error("[email] new commission (influencer) failed:", err))
      );
    }

    const brandEmail = brand.user.email;
    if (brandEmail) {
      after(() =>
        sendEmail({
          to: brandEmail,
          subject: "📋 Nowa prowizja do zatwierdzenia",
          react: CommissionPendingBrandEmail({
            brandName: brand.companyName,
            influencerName: link.influencerProfile.displayName,
            productName: link.product.name,
            orderValue: orderAmount,
            commissionAmount: influencerCommission,
            orderId: String(orderId),
          }),
        }).catch((err) => console.error("[email] commission pending (brand) failed:", err))
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversion registered",
      breakdown: {
        orderAmount,
        totalCommission,
        influencerCommission,
        platformCommission,
        currency,
      },
    });
  } catch (error) {
    console.error("Conversion webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
