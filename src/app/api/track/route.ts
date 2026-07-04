export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
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

  const brand = await prisma.brandProfile.findUnique({ where: { apiKey } });
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

  // BUG-03: orderId idempotency — check both Commission and Conversion tables
  if (orderId) {
    const [existingCommission, existingConversion] = await Promise.all([
      prisma.commission.findFirst({ where: { orderId } }),
      prisma.conversion.findFirst({ where: { orderId } }),
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
      influencerProfile: true,
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

  // BUG-01b: use influencerCommissionRate for influencer earnings (not total commissionRate)
  const influencerCommissionAmount =
    orderValue * (product.influencerCommissionRate / 100);
  const totalCommissionAmount =
    orderValue * (product.commissionRate / 100);
  const platformCommissionAmount =
    totalCommissionAmount - influencerCommissionAmount;

  const commission = await prisma.$transaction(async (tx) => {
    const created = await tx.commission.create({
      data: {
        influencerId:     affiliateLink.influencerProfileId,
        brandId:          product.brandProfileId,
        productId:        product.id,
        affiliateLinkId:  affiliateLink.id,
        orderId,
        orderValue,
        commissionPercent: product.influencerCommissionRate, // influencer's rate
        commissionAmount:  influencerCommissionAmount,        // influencer's share
        status: CommissionStatus.PENDING,
      },
    });

    await tx.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: {
        totalConversions: { increment: 1 },
        totalEarnings:    { increment: influencerCommissionAmount }, // BUG-01b
      },
    });

    // Backward-compatibility Conversion row with full commission breakdown
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
