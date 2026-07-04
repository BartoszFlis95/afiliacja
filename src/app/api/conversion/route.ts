export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401 }
      );
    }

    const body = await request.text();

    if (signature) {
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
    }

    const data = JSON.parse(body);
    const { orderId, amount, ref, currency = "PLN", email, productSlug } = data;

    if (!orderId || !amount || !ref) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: orderId, amount, ref" },
        { status: 400 }
      );
    }

    const [existingConversion, existingCommission] = await Promise.all([
      prisma.conversion.findFirst({ where: { orderId: String(orderId) } }),
      prisma.commission.findFirst({ where: { orderId: String(orderId) } }),
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
      include: { product: true },
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

    const totalCommission = (orderAmount * totalCommissionRate) / 100;
    const influencerCommission = (orderAmount * influencerRate) / 100;
    const platformCommission = totalCommission - influencerCommission;

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
