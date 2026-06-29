export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { code },
    include: { product: true },
  });

  if (!affiliateLink) {
    return NextResponse.redirect(new URL("/products", request.url));
  }

  const { product } = affiliateLink;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? null;
  const referer = request.headers.get("referer") ?? null;

  await prisma.$transaction([
    prisma.click.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        ip,
        userAgent,
        referer,
      },
    }),
    prisma.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: { totalClicks: { increment: 1 } },
    }),
  ]);

  return NextResponse.redirect(
    new URL(`/products/${product.slug}`, request.url)
  );
}