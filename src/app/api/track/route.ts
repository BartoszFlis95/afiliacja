export const dynamic = "force-dynamic";

import { NextRequest, NextResponse, after } from "next/server";

import { prisma } from "@/lib/prisma";
import { logFraud } from "@/lib/fraud-logger";
import { sendEmail } from "@/lib/resend";
import { formatEmailAmount } from "@/emails/utils";
import NewCommissionEmail from "@/emails/NewCommissionEmail";
import CommissionPendingBrandEmail from "@/emails/CommissionPendingBrandEmail";
import { CommissionStatus } from "@prisma/client";

type TrackBody = {
  code?: unknown;
  orderValue?: unknown;
  orderId?: unknown;
};

export async function POST(request: NextRequest) {
  // BUG-01: verify x-api-key against BrandProfile
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Brak nagłówka x-api-key." },
      { status: 401 }
    );
  }

  const brand = await prisma.brandProfile.findUnique({
    where: { apiKey },
    include: { user: { select: { email: true } } },
  });
  if (!brand) {
    return NextResponse.json(
      { success: false, error: "Nieprawidłowy klucz API." },
      { status: 401 }
    );
  }

  let body: TrackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Nieprawidłowy format JSON." },
      { status: 400 }
    );
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const orderValue =
    typeof body.orderValue === "number" ? body.orderValue : NaN;
  const orderId =
    typeof body.orderId === "string" && body.orderId.length > 0
      ? body.orderId
      : null;

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Pole 'code' jest wymagane." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(orderValue) || orderValue <= 0) {
    return NextResponse.json(
      { success: false, error: "Pole 'orderValue' musi być liczbą dodatnią." },
      { status: 400 }
    );
  }

  // BUG-03: orderId idempotency — check both Commission and Conversion tables,
  // scoped to this brand (order IDs come from each brand's own store and can
  // collide across unrelated brands).
  if (orderId) {
    const [existingCommission, existingConversion] = await Promise.all([
      prisma.commission.findFirst({ where: { orderId, brandId: brand.id } }),
      prisma.conversion.findFirst({
        where: { orderId, affiliateLink: { product: { brandProfileId: brand.id } } },
      }),
    ]);
    if (existingCommission || existingConversion) {
      return NextResponse.json(
        { success: false, error: "Zamówienie zostało już zarejestrowane." },
        { status: 409 }
      );
    }
  }

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { code },
    include: {
      product: true,
      influencerProfile: { include: { user: { select: { email: true } } } },
    },
  });

  if (!affiliateLink || !affiliateLink.product) {
    return NextResponse.json(
      { success: false, error: "Nie znaleziono linku afiliacyjnego." },
      { status: 404 }
    );
  }

  // BUG-01: verify the link's product belongs to the authenticated brand
  if (affiliateLink.product.brandProfileId !== brand.id) {
    return NextResponse.json(
      { success: false, error: "Link afiliacyjny nie należy do tej marki." },
      { status: 403 }
    );
  }

  const { product } = affiliateLink;

  // FRAUD 3 — cooling period: konwersję rejestrujemy tylko jeśli z tego linku
  // był realny klik w ciągu ostatnich 30 dni (chroni przed atrybucją bez ruchu).
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentClick = await prisma.click.findFirst({
    where: {
      affiliateLinkId: affiliateLink.id,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!recentClick) {
    logFraud("cooling-period", { linkCode: code, orderId });
    return NextResponse.json(
      { success: false, error: "Brak kliknięcia w ostatnich 30 dniach" },
      { status: 422 }
    );
  }

  // BUG-01b: use influencerCommissionRate for influencer earnings (not total commissionRate)
  const influencerCommissionAmount =
    orderValue * (product.influencerCommissionRate / 100);
  const totalCommissionAmount =
    orderValue * (product.commissionRate / 100);
  const platformCommissionAmount =
    totalCommissionAmount - influencerCommissionAmount;

  // FRAUD 5 — suspicious conversion detection: nie blokujemy, tylko oznaczamy
  // flagą do ręcznej weryfikacji przez admina/markę.
  const suspiciousReasons: string[] = [];

  const avgConversion = await prisma.conversion.aggregate({
    where: { affiliateLinkId: affiliateLink.id },
    _avg: { amount: true },
  });
  if (
    avgConversion._avg.amount &&
    orderValue > Number(avgConversion._avg.amount) * 100
  ) {
    suspiciousReasons.push("orderValue 100x powyżej średniej");
  }

  // IP klika, który zainicjował tę konwersję — zapisywane na Commission, żeby
  // móc wykryć wiele konwersji z tego samego IP w krótkim czasie.
  const clickIp = recentClick.ip;
  if (clickIp) {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const conversionsFromIp = await prisma.commission.count({
      where: {
        ipAddress: clickIp,
        createdAt: { gte: last24h },
      },
    });
    if (conversionsFromIp >= 5) {
      suspiciousReasons.push("Więcej niż 5 konwersji z tego samego IP w ciągu 24h");
    }
  }

  const isSuspicious = suspiciousReasons.length > 0;
  const suspiciousReason = isSuspicious ? suspiciousReasons.join("; ") : null;

  if (isSuspicious) {
    logFraud("suspicious-conversion", { orderId, orderValue, reason: suspiciousReason });
  }

  let commission;
  try {
    commission = await prisma.$transaction(async (tx) => {
      const created = await tx.commission.create({
        data: {
          influencerId:     affiliateLink.influencerProfileId,
          brandId:          product.brandProfileId,
          productId:        product.id,
          affiliateLinkId:  affiliateLink.id,
          orderId,
          orderValue,
          commissionPercent: product.influencerCommissionRate,
          commissionAmount:  influencerCommissionAmount,
          status: CommissionStatus.PENDING,
          ipAddress:        clickIp,
          isSuspicious,
          suspiciousReason,
        },
      });

      await tx.affiliateLink.update({
        where: { id: affiliateLink.id },
        data: {
          totalConversions: { increment: 1 },
          totalEarnings:    { increment: influencerCommissionAmount },
        },
      });

      await tx.conversion.create({
        data: {
          affiliateLinkId:      affiliateLink.id,
          orderId,
          amount:               orderValue,
          commission:           totalCommissionAmount,
          influencerCommission: influencerCommissionAmount,
          platformCommission:   platformCommissionAmount,
          status:               "PENDING",
        },
      });

      return created;
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Wewnętrzny błąd serwera." },
      { status: 500 }
    );
  }

  // Nie blokuj odpowiedzi webhooka na wysyłce maili — fire-and-forget, przez after().
  const influencerEmail = affiliateLink.influencerProfile.user.email;
  if (influencerEmail) {
    after(() =>
      sendEmail({
        to: influencerEmail,
        subject: `🎉 Nowa prowizja! +${formatEmailAmount(influencerCommissionAmount)}`,
        react: NewCommissionEmail({
          influencerName: affiliateLink.influencerProfile.displayName,
          productName: product.name,
          brandName: brand.companyName,
          orderValue,
          commissionAmount: influencerCommissionAmount,
          commissionPercent: product.influencerCommissionRate,
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
          influencerName: affiliateLink.influencerProfile.displayName,
          productName: product.name,
          orderValue,
          commissionAmount: influencerCommissionAmount,
          orderId: orderId ?? undefined,
        }),
      }).catch((err) => console.error("[email] commission pending (brand) failed:", err))
    );
  }

  return NextResponse.json({
    success: true,
    commissionId:     commission.id,
    commissionAmount: influencerCommissionAmount,
    breakdown: {
      orderAmount:        orderValue,
      totalCommission:    totalCommissionAmount,
      influencerCommission: influencerCommissionAmount,
      platformCommission:   platformCommissionAmount,
    },
  });
}
