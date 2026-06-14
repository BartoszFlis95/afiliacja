"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
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
  ]);

  return {
    totalUsers,
    totalBrands,
    totalInfluencers,
    totalProducts,
    totalClicks,
    totalConversions,
    totalRevenue: Number(revenueAggregate._sum.amount ?? 0),
  };
}