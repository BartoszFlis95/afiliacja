import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TrackBody = {
  code?: unknown;
  amount?: unknown;
};

export async function POST(request: NextRequest) {
  let body: TrackBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Field 'code' is required" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, error: "Field 'amount' must be a positive number" },
      { status: 400 },
    );
  }

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { code },
    include: { product: true },
  });

  if (!affiliateLink || !affiliateLink.product) {
    return NextResponse.json(
      { success: false, error: "Affiliate link not found" },
      { status: 404 },
    );
  }

  const commissionRate = Number(affiliateLink.product.commissionRate);
  const commission = amount * (commissionRate / 100);

  // Tworzymy konwersję i aktualizujemy agregaty linku w jednej transakcji.
  const conversion = await prisma.$transaction(async (tx) => {
    const created = await tx.conversion.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        amount,
        commission,
        status: "PENDING",
      },
    });

    await tx.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: {
        totalConversions: { increment: 1 },
        totalEarnings: { increment: commission },
      },
    });

    return created;
  });

  return NextResponse.json(
    { success: true, conversionId: conversion.id },
    { status: 201 },
  );
}
