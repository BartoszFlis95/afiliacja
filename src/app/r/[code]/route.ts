export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const link = await prisma.affiliateLink.findUnique({
    where: { code },
    include: {
      product: true,
      influencerProfile: true,
    },
  });

  if (!link || !link.product.productUrl) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;
  const referer = request.headers.get("referer") ?? null;

  await prisma.$transaction([
    prisma.click.create({
      data: {
        affiliateLinkId: link.id,
        ip,
        userAgent,
        referer,
      },
    }),
    prisma.affiliateLink.update({
      where: { id: link.id },
      data: { totalClicks: { increment: 1 } },
    }),
  ]);

  const targetUrl = new URL(link.product.productUrl);
  targetUrl.searchParams.set("ref", link.influencerProfile.id);
  targetUrl.searchParams.set("utm_source", "deneeu");
  targetUrl.searchParams.set("utm_medium", "affiliate");
  targetUrl.searchParams.set("utm_campaign", link.code);

  const response = NextResponse.redirect(targetUrl.toString(), { status: 302 });

  const cookieOptions = {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: false,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set("deneeu_ref", link.influencerProfile.id, cookieOptions);
  response.cookies.set("deneeu_link_code", link.code, cookieOptions);

  return response;
}
