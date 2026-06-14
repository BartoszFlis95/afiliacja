import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const trackSchema = z.object({
  code: z.string().min(1),
  amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { code, amount } = parsed.data;

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { code },
    include: { product: true },
  });

  if (!affiliateLink) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const commission =
    amount * (affiliateLink.product.commissionRate / 100);

  await prisma.$transaction([
    prisma.conversion.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        amount,
        commission,
        status: "PENDING",
      },
    }),
    prisma.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: {
        totalConversions: { increment: 1 },
        totalEarnings: { increment: commission },
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
