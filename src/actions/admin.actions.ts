"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Unauthorized: ADMIN role required");
  }
  return session;
}

export async function getAllUsersAction() {
  await assertAdmin();

  return prisma.user.findMany({
    include: {
      brandProfile: true,
      influencerProfile: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllProductsAction() {
  await assertAdmin();

  return prisma.product.findMany({
    include: {
      brandProfile: true,
      _count: { select: { affiliateLinks: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleProductStatusAction(productId: string) {
  await assertAdmin();

  if (!productId) throw new Error("productId is required");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true },
  });

  if (!product) throw new Error("Product not found");

  const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { status: nextStatus },
    select: { id: true, status: true },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/admin/dashboard");

  return updated;
}

/**
 * Komisje oznaczone przez fraud detection (isSuspicious=true) jako wymagające
 * ręcznej weryfikacji admina — patrz reguły w src/app/api/track/route.ts.
 */
export async function getSuspiciousCommissionsAction() {
  await assertAdmin();

  const commissions = await prisma.commission.findMany({
    where: { isSuspicious: true },
    include: {
      influencer: { select: { displayName: true } },
      brand: { select: { companyName: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return commissions.map((c) => ({
    ...c,
    orderValue: Number(c.orderValue),
    commissionAmount: Number(c.commissionAmount),
  }));
}

/**
 * Pełna historia audytowa fraud detection (self-click, IP rate limit,
 * cooling period, suspicious conversion) — patrz src/lib/fraud-logger.ts.
 */
export async function getFraudLogsAction() {
  await assertAdmin();

  const logs = await prisma.fraudLog.findMany({
    include: {
      affiliateLink: {
        select: {
          code: true,
          product: { select: { name: true } },
          influencerProfile: { select: { displayName: true } },
        },
      },
      commission: {
        select: {
          id: true,
          orderValue: true,
          brand: { select: { companyName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => ({
    ...log,
    commission: log.commission
      ? { ...log.commission, orderValue: Number(log.commission.orderValue) }
      : null,
  }));
}

export async function getPlatformStatsAction() {
  await assertAdmin();

  const [
    totalUsers,
    totalBrands,
    totalInfluencers,
    totalProducts,
    totalClicks,
    totalConversions,
    revenueAggregate,
    platformCommissionAggregate,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "BRAND" } }),
    prisma.user.count({ where: { role: "INFLUENCER" } }),
    prisma.product.count(),
    prisma.click.count(),
    prisma.conversion.count(),
    prisma.conversion.aggregate({
      _sum: { amount: true },
    }),
    prisma.conversion.aggregate({
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { platformCommission: true },
    }),
  ]);

  return {
    totalUsers,
    totalBrands,
    totalInfluencers,
    totalProducts,
    totalClicks,
    totalConversions,
    totalRevenue: Number(revenueAggregate._sum.amount ?? 0),
    platformCommission: Number(platformCommissionAggregate._sum.platformCommission ?? 0),
  };
}

export async function getFinanceSummaryAction() {
  await assertAdmin();

  const now = new Date();
  const start12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    revenueAgg,
    influencerCommissionAgg,
    platformCommissionAgg,
    pendingPayoutsAgg,
    completedPayoutsAgg,
    conversionsLast12Months,
    payoutsByInfluencer,
    revenueByBrandConversions,
  ] = await Promise.all([
    prisma.conversion.aggregate({
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { amount: true },
    }),
    prisma.conversion.aggregate({
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { influencerCommission: true },
    }),
    prisma.conversion.aggregate({
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { platformCommission: true },
    }),
    prisma.payout.aggregate({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      _sum: { amount: true },
    }),
    prisma.payout.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.conversion.findMany({
      where: { status: { in: ["CONFIRMED", "PAID"] }, createdAt: { gte: start12MonthsAgo } },
      select: { amount: true, createdAt: true },
    }),
    prisma.payout.findMany({
      where: { status: "COMPLETED" },
      include: { influencer: { select: { displayName: true } } },
    }),
    prisma.conversion.findMany({
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      select: {
        amount: true,
        affiliateLink: {
          select: { product: { select: { brandProfile: { select: { companyName: true } } } } },
        },
      },
    }),
  ]);

  const monthKeys: string[] = [];
  const monthlyRevenueMap = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(start12MonthsAgo.getFullYear(), start12MonthsAgo.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
    monthlyRevenueMap.set(key, 0);
  }
  for (const conv of conversionsLast12Months) {
    const d = conv.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyRevenueMap.has(key)) {
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) ?? 0) + Number(conv.amount));
    }
  }
  const monthFormatter = new Intl.DateTimeFormat("pl-PL", { month: "short", year: "2-digit" });
  const monthlyRevenue = monthKeys.map((key) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: monthFormatter.format(new Date(year, month - 1, 1)),
      value: monthlyRevenueMap.get(key) ?? 0,
    };
  });

  const influencerPayoutMap = new Map<string, number>();
  for (const p of payoutsByInfluencer) {
    const name = p.influencer?.displayName ?? "—";
    influencerPayoutMap.set(name, (influencerPayoutMap.get(name) ?? 0) + Number(p.amount));
  }
  const topInfluencersByPayout = Array.from(influencerPayoutMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const brandRevenueMap = new Map<string, number>();
  for (const conv of revenueByBrandConversions) {
    const name = conv.affiliateLink?.product?.brandProfile?.companyName ?? "—";
    brandRevenueMap.set(name, (brandRevenueMap.get(name) ?? 0) + Number(conv.amount));
  }
  const topBrandsByRevenue = Array.from(brandRevenueMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    totalRevenue: Number(revenueAgg._sum.amount ?? 0),
    influencerCommissions: Number(influencerCommissionAgg._sum.influencerCommission ?? 0),
    platformRevenue: Number(platformCommissionAgg._sum.platformCommission ?? 0),
    pendingPayouts: Number(pendingPayoutsAgg._sum.amount ?? 0),
    totalPaidOut: Number(completedPayoutsAgg._sum.amount ?? 0),
    monthlyRevenue,
    topInfluencersByPayout,
    topBrandsByRevenue,
  };
}

// ---------------------------------------------------------------------------
// INVITE CODES (rejestracja marek wymaga kodu wygenerowanego przez admina —
// influencerzy rejestrują się bez kodu, patrz src/actions/auth.actions.ts)
// ---------------------------------------------------------------------------

export async function getInviteCodesAction() {
  await assertAdmin();

  const codes = await prisma.inviteCode.findMany({
    include: { createdBy: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return codes;
}

export async function generateInviteCodeAction(options?: {
  maxUses?: number;
  expiresAt?: Date | null;
}) {
  const session = await assertAdmin();
  const adminId = (session?.user as { id?: string } | undefined)?.id;
  if (!adminId) throw new Error("Unauthorized");

  const code = `INV-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  const created = await prisma.inviteCode.create({
    data: {
      code,
      maxUses: options?.maxUses && options.maxUses > 0 ? options.maxUses : 1,
      expiresAt: options?.expiresAt ?? null,
      createdById: adminId,
    },
  });

  revalidatePath("/admin/invite-codes");

  return created;
}

export async function toggleInviteCodeActiveAction(inviteCodeId: string) {
  await assertAdmin();

  if (!inviteCodeId) throw new Error("inviteCodeId is required");

  const existing = await prisma.inviteCode.findUnique({
    where: { id: inviteCodeId },
    select: { isActive: true },
  });
  if (!existing) throw new Error("Invite code not found");

  const updated = await prisma.inviteCode.update({
    where: { id: inviteCodeId },
    data: { isActive: !existing.isActive },
  });

  revalidatePath("/admin/invite-codes");

  return updated;
}