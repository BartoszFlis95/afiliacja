export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { CommissionStatus } from "@prisma/client";

type TrackBody = {
  code?: unknown;
  orderValue?: unknown;
  orderId?: unknown;
};

export async function POST(request: Request) {
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

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { code },
    include: {
      product: true, // carries commissionRate + brandProfileId
      influencerProfile: true,
    },
  });

  if (!affiliateLink || !affiliateLink.product) {
    return NextResponse.json(
      { success: false, error: "Nie znaleziono linku afiliacyjnego." },
      { status: 404 }
    );
  }

  const { product } = affiliateLink;
  const commissionAmount = orderValue * (product.commissionRate / 100);

  // Three writes that must succeed or fail together:
  // 1) the commission, 2) the link aggregates, 3) the legacy Conversion row.
  const commission = await prisma.$transaction(async (tx) => {
    const created = await tx.commission.create({
      data: {
        influencerId: affiliateLink.influencerProfileId,
        brandId: product.brandProfileId,
        productId: product.id,
        affiliateLinkId: affiliateLink.id,
        orderId,
        orderValue,
        commissionPercent: product.commissionRate,
        commissionAmount,
        status: CommissionStatus.PENDING,
      },
    });

    await tx.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: {
        totalConversions: { increment: 1 },
        totalEarnings: { increment: commissionAmount },
      },
    });

    // Backward-compatibility: keep populating the older Conversion table.
    await tx.conversion.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        amount: orderValue,
        commission: commissionAmount,
        status: "PENDING",
      },
    });

    return created;
  });

  return NextResponse.json({
    success: true,
    commissionId: commission.id,
    commissionAmount,
  });
}
