"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { redirect } from "next/navigation";

const BrandProfileSchema = z.object({
  companyName: z.string().min(2, "Nazwa firmy musi mieć co najmniej 2 znaki"),
  industry: z.string().optional(),
  website: z.string().url("Nieprawidłowy URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

async function getAuthUser() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "BRAND") {
    redirect("/login");
  }
  return session.user as NonNullable<typeof session.user> & { id: string };
}

export async function createBrandProfileAction(formData: unknown) {
  try {
    const user = await getAuthUser();

    const parsed = BrandProfileSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.brandProfile.findUnique({
      where: { userId: user.id },
    });
    if (existing) {
      return { success: false, error: "Profil marki już istnieje" };
    }

    const profile = await prisma.brandProfile.create({
      data: {
        userId: user.id,
        companyName: parsed.data.companyName,
        industry: parsed.data.industry,
        website: parsed.data.website || null,
        description: parsed.data.description,
      },
    });

    return { success: true, data: profile };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas tworzenia profilu" };
  }
}

export async function updateBrandProfileAction(formData: unknown) {
  try {
    const user = await getAuthUser();

    const parsed = BrandProfileSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const profile = await prisma.brandProfile.update({
      where: { userId: user.id },
      data: {
        companyName: parsed.data.companyName,
        industry: parsed.data.industry,
        website: parsed.data.website || null,
        description: parsed.data.description,
      },
    });

    return { success: true, data: profile };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas aktualizacji profilu" };
  }
}

export async function getBrandProfileAction() {
  try {
    const user = await getAuthUser();

    const profile = await prisma.brandProfile.findUnique({
      where: { userId: user.id },
    });

    return { success: true, data: profile };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas pobierania profilu" };
  }
}

export async function getBrandStatsAction() {
  try {
    const user = await getAuthUser();

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: user.id },
    });

    if (!brandProfile) {
      return { success: false, error: "Brak profilu marki" };
    }

    const [
      totalProducts,
      activeProducts,
      clicksData,
      conversionsData,
      revenueData,
      topInfluencers,
    ] = await Promise.all([
      prisma.product.count({ where: { brandProfileId: brandProfile.id } }),
      prisma.product.count({
        where: { brandProfileId: brandProfile.id, status: "ACTIVE" },
      }),
      prisma.click.count({
        where: {
          affiliateLink: { product: { brandProfileId: brandProfile.id } },
        },
      }),
      prisma.conversion.count({
        where: {
          affiliateLink: { product: { brandProfileId: brandProfile.id } },
        },
      }),
      prisma.conversion.aggregate({
        where: {
          affiliateLink: { product: { brandProfileId: brandProfile.id } },
          status: "CONFIRMED",
        },
        _sum: { amount: true },
      }),
      prisma.affiliateLink.findMany({
        where: { product: { brandProfileId: brandProfile.id } },
        include: { influencerProfile: true },
        orderBy: { totalEarnings: "desc" },
        take: 5,
      }),
    ]);

    return {
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalClicks: clicksData,
        totalConversions: conversionsData,
        totalRevenue: Number(revenueData._sum.amount ?? 0),
        topInfluencers: topInfluencers.map((l) => ({
          ...l,
          totalEarnings: Number(l.totalEarnings),
        })),
      },
    };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas pobierania statystyk" };
  }
}

export interface BrandRangeStats {
  dailyData: { date: string; clicks: number; conversions: number }[];
  revenueByProduct: { label: string; value: number }[];
  performanceByInfluencer: { label: string; value: number }[];
}

export async function getBrandRangeStatsAction(
  days: 7 | 30 | 90
): Promise<{ success: true; data: BrandRangeStats } | { success: false; error: string }> {
  try {
    const user = await getAuthUser();

    const brandProfile = await prisma.brandProfile.findUnique({ where: { userId: user.id } });
    if (!brandProfile) {
      return { success: false, error: "Brak profilu marki" };
    }

    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);

    const [clicks, conversions] = await Promise.all([
      prisma.click.findMany({
        where: {
          affiliateLink: { product: { brandProfileId: brandProfile.id } },
          createdAt: { gte: from },
        },
        select: { createdAt: true },
      }),
      prisma.conversion.findMany({
        where: {
          affiliateLink: { product: { brandProfileId: brandProfile.id } },
          status: "CONFIRMED",
          createdAt: { gte: from },
        },
        select: {
          amount: true,
          createdAt: true,
          affiliateLink: {
            select: {
              product: { select: { name: true } },
              influencerProfile: { select: { displayName: true } },
            },
          },
        },
      }),
    ]);

    const dailyMap = new Map<string, { date: string; clicks: number; conversions: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, clicks: 0, conversions: 0 });
    }
    for (const click of clicks) {
      const key = click.createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      if (bucket) bucket.clicks += 1;
    }
    for (const conv of conversions) {
      const key = conv.createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      if (bucket) bucket.conversions += 1;
    }
    const dailyData = Array.from(dailyMap.values());

    const revenueByProductMap = new Map<string, number>();
    const revenueByInfluencerMap = new Map<string, number>();
    for (const conv of conversions) {
      const amount = Number(conv.amount);
      const productName = conv.affiliateLink?.product?.name ?? "—";
      revenueByProductMap.set(productName, (revenueByProductMap.get(productName) ?? 0) + amount);
      const influencerName = conv.affiliateLink?.influencerProfile?.displayName ?? "—";
      revenueByInfluencerMap.set(
        influencerName,
        (revenueByInfluencerMap.get(influencerName) ?? 0) + amount
      );
    }

    const revenueByProduct = Array.from(revenueByProductMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const performanceByInfluencer = Array.from(revenueByInfluencerMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      success: true,
      data: { dailyData, revenueByProduct, performanceByInfluencer },
    };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas pobierania statystyk" };
  }
}