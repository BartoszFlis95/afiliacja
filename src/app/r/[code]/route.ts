export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logFraud } from "@/lib/fraud-logger";

const IP_RATE_LIMIT = 10;
const IP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 godzina

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

  if (!link) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!link.product.productUrl) {
    console.warn(`[/r/${code}] Produkt ${link.product.id} ma pusty productUrl`);
    return NextResponse.redirect(new URL("/products", request.url));
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;
  const referer = request.headers.get("referer") ?? null;

  // FRAUD 1 — self-click: influencer klikający własny link.
  // Blokujemy zapis Click i przekierowujemy prosto na productUrl.
  const session = await auth();
  if (session?.user?.id && session.user.id === link.influencerProfile.userId) {
    logFraud("self-click", { userId: session.user.id, linkCode: code });
    console.warn("[fraud] self-click blocked:", session.user.id);

    const response = NextResponse.redirect(link.product.productUrl, { status: 302 });
    response.headers.set("X-Fraud-Reason", "self-click");
    return response;
  }

  // FRAUD 2 — limit kliknięć per IP: max 10 kliknięć/godzinę/link.
  if (ip) {
    const oneHourAgo = new Date(Date.now() - IP_RATE_WINDOW_MS);
    const recentClicks = await prisma.click.count({
      where: {
        affiliateLinkId: link.id,
        ip,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentClicks >= IP_RATE_LIMIT) {
      logFraud("ip-rate-limit", { ip, linkCode: code, count: recentClicks });
      console.warn("[fraud] IP rate limit:", ip);

      return NextResponse.redirect(link.product.productUrl, { status: 302 });
    }
  }

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
