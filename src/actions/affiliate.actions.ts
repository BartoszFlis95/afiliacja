"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

async function requireInfluencerProfile() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== Role.INFLUENCER) {
    throw new Error("Brak dostępu");
  }
  const influencerProfile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!influencerProfile) {
    throw new Error("Nie znaleziono profilu influencera");
  }
  return influencerProfile;
}

async function requireBrandProfile() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== Role.BRAND) {
    throw new Error("Brak dostępu");
  }
  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) {
    throw new Error("Nie znaleziono profilu marki");
  }
  return brandProfile;
}

export async function getInfluencerLinksAction() {
  try {
    const influencerProfile = await requireInfluencerProfile();

    const links = await prisma.affiliateLink.findMany({
      where: { influencerProfileId: influencerProfile.id },
      include: {
        product: {
          include: { brandProfile: true },
        },
        _count: {
          select: { clicks: true, conversions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = links.map((link) => ({
      ...link,
      totalEarnings: Number(link.totalEarnings),
      product: {
        ...link.product,
        price: link.product.price ? Number(link.product.price) : null,
        commissionRate: Number(link.product.commissionRate),
      },
    }));

    return { success: true as const, data: serialized };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Błąd pobierania linków",
    };
  }
}

export async function getAffiliateLinkStatsAction(linkId: string) {
  try {
    const influencerProfile = await requireInfluencerProfile();

    const link = await prisma.affiliateLink.findUnique({
      where: { id: linkId },
    });

    if (!link || link.influencerProfileId !== influencerProfile.id) {
      return { success: false as const, error: "Link nie istnieje lub brak dostępu" };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentClicks = await prisma.click.findMany({
      where: {
        affiliateLinkId: linkId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const clicksByDay = recentClicks.reduce<Record<string, number>>((acc, click) => {
      const day = click.createdAt.toISOString().slice(0, 10);
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    }, {});

    const dailyClicks = Object.entries(clicksByDay).map(([date, clicks]) => ({
      date,
      clicks,
    }));

    return {
      success: true as const,
      data: {
        totalClicks: link.totalClicks,
        totalConversions: link.totalConversions,
        totalEarnings: Number(link.totalEarnings),
        dailyClicks,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Błąd pobierania statystyk",
    };
  }
}

export async function trackClickAction(
  code: string,
  ip?: string,
  userAgent?: string,
  referer?: string
) {
  try {
    const link = await prisma.affiliateLink.findUnique({
      where: { code },
      include: { product: { select: { slug: true } } },
    });

    if (!link) {
      return { success: false as const, error: "Nieprawidłowy kod" };
    }

    await prisma.$transaction([
      prisma.click.create({
        data: {
          affiliateLinkId: link.id,
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          referer: referer ?? null,
        },
      }),
      prisma.affiliateLink.update({
        where: { id: link.id },
        data: { totalClicks: { increment: 1 } },
      }),
    ]);

    return { success: true as const, data: { productSlug: link.product.slug } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Błąd śledzenia kliknięcia",
    };
  }
}

export async function getBrandStatsAction() {
  try {
    const brandProfile = await requireBrandProfile();

    const products = await prisma.product.findMany({
      where: { brandProfileId: brandProfile.id },
      select: { id: true },
    });

    const productIds = products.map((p) => p.id);

    const [totalProducts, aggregated, topInfluencers] = await Promise.all([
      prisma.product.count({ where: { brandProfileId: brandProfile.id } }),
      prisma.affiliateLink.aggregate({
        where: { productId: { in: productIds } },
        _sum: {
          totalClicks: true,
          totalConversions: true,
        },
      }),
      prisma.affiliateLink.findMany({
        where: { productId: { in: productIds } },
        include: {
          influencerProfile: {
            select: { displayName: true, avatarUrl: true },
          },
        },
        orderBy: { totalEarnings: "desc" },
        take: 5,
      }),
    ]);

    const totalRevenue = await prisma.conversion.aggregate({
      where: {
        affiliateLink: { productId: { in: productIds } },
        status: { in: ["CONFIRMED", "PAID"] },
      },
      _sum: { amount: true },
    });

    return {
      success: true as const,
      data: {
        totalProducts,
        totalClicks: aggregated._sum.totalClicks ?? 0,
        totalConversions: aggregated._sum.totalConversions ?? 0,
        totalRevenue: Number(totalRevenue._sum.amount ?? 0),
        topInfluencers: topInfluencers.map((l) => ({
          displayName: l.influencerProfile.displayName,
          avatarUrl: l.influencerProfile.avatarUrl,
          totalClicks: l.totalClicks,
          totalConversions: l.totalConversions,
          totalEarnings: Number(l.totalEarnings),
        })),
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Błąd pobierania statystyk marki",
    };
  }
}

export async function getInfluencerStatsAction() {
  try {
    const influencerProfile = await requireInfluencerProfile();

    const aggregated = await prisma.affiliateLink.aggregate({
      where: { influencerProfileId: influencerProfile.id },
      _count: { id: true },
      _sum: {
        totalClicks: true,
        totalConversions: true,
        totalEarnings: true,
      },
    });

    const totalLinks = aggregated._count.id;
    const totalClicks = aggregated._sum.totalClicks ?? 0;
    const totalConversions = aggregated._sum.totalConversions ?? 0;
    const totalEarnings = Number(aggregated._sum.totalEarnings ?? 0);
    const conversionRate =
      totalClicks > 0
        ? Math.round((totalConversions / totalClicks) * 10000) / 100
        : 0;

    return {
      success: true as const,
      data: {
        totalLinks,
        totalClicks,
        totalConversions,
        totalEarnings,
        conversionRate,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Błąd pobierania statystyk influencera",
    };
  }
}