export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logFraud } from "@/lib/fraud-logger";
import { FraudType } from "@prisma/client";

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
  // Zapisujemy Click jako fraud (audyt), nie liczymy do totalClicks, 403.
  const session = await auth();
  if (session?.user?.id && session.user.id === link.influencerProfile.userId) {
    await logFraud({
      type: FraudType.SELF_CLICK,
      reason: "Influencer kliknął własny link afiliacyjny",
      affiliateLinkId: link.id,
      ip,
      userAgent,
      metadata: { userId: session.user.id, linkCode: code },
    });

    await prisma.click.create({
      data: {
        affiliateLinkId: link.id,
        ip,
        userAgent,
        referer,
        isFraud: true,
        fraudReason: "self_click",
      },
    });

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // FRAUD 2 — limit kliknięć per IP: max 10 kliknięć/godzinę/link.
  // Do limitu liczą się tylko klik-i NIE oznaczone jako fraud — inaczej
  // zapisywanie zablokowanych prób (ta zmiana) sztucznie podbijałoby licznik.
  if (ip) {
    const oneHourAgo = new Date(Date.now() - IP_RATE_WINDOW_MS);
    const recentClicks = await prisma.click.count({
      where: {
        affiliateLinkId: link.id,
        ip,
        isFraud: false,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentClicks >= IP_RATE_LIMIT) {
      await logFraud({
        type: FraudType.IP_RATE_LIMIT,
        reason: `Przekroczono limit ${IP_RATE_LIMIT} kliknięć/godzinę z tego IP`,
        affiliateLinkId: link.id,
        ip,
        userAgent,
        metadata: { linkCode: code, count: recentClicks },
      });

      await prisma.click.create({
        data: {
          affiliateLinkId: link.id,
          ip,
          userAgent,
          referer,
          isFraud: true,
          fraudReason: "ip_rate_limit",
        },
      });

      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
