"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductSchema } from "@/lib/validations/product.schema";
import { redirect } from "next/navigation";

async function getBrandProfile() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!brandProfile) {
    redirect("/brand/onboarding");
  }

  return brandProfile;
}

function serializeProduct<T extends { price: unknown; commissionRate: unknown }>(p: T) {
  return { ...p, price: p.price != null ? Number(p.price) : null, commissionRate: Number(p.commissionRate) };
}

export async function createProductAction(formData: unknown) {
  try {
    const brandProfile = await getBrandProfile();

    const parsed = ProductSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { name, description, category, price, commissionRate, slug, status } = parsed.data;

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return { success: false, error: "Produkt z tym slugiem już istnieje" };
    }

    const product = await prisma.product.create({
      data: {
        brandProfileId: brandProfile.id,
        name,
        description,
        category,
        price,
        commissionRate,
        slug,
        status,
      },
    });

    return { success: true, data: serializeProduct(product) };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas tworzenia produktu" };
  }
}

export async function updateProductAction(id: string, formData: unknown) {
  try {
    const brandProfile = await getBrandProfile();

    const parsed = ProductSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.brandProfileId !== brandProfile.id) {
      return { success: false, error: "Produkt nie istnieje lub brak uprawnień" };
    }

    const { name, description, category, price, commissionRate, slug, status } = parsed.data;

    if (slug !== product.slug) {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        return { success: false, error: "Produkt z tym slugiem już istnieje" };
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { name, description, category, price, commissionRate, slug, status },
    });

    return { success: true, data: serializeProduct(updated) };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas aktualizacji produktu" };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const brandProfile = await getBrandProfile();

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.brandProfileId !== brandProfile.id) {
      return { success: false, error: "Produkt nie istnieje lub brak uprawnień" };
    }

    await prisma.product.delete({ where: { id } });

    return { success: true };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas usuwania produktu" };
  }
}

export async function getProductsAction() {
  try {
    const brandProfile = await getBrandProfile();

    const products = await prisma.product.findMany({
      where: { brandProfileId: brandProfile.id },
      include: { _count: { select: { affiliateLinks: true } } },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: products.map(serializeProduct) };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas pobierania produktów" };
  }
}

export async function toggleProductStatusAction(id: string) {
  try {
    const brandProfile = await getBrandProfile();

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.brandProfileId !== brandProfile.id) {
      return { success: false, error: "Produkt nie istnieje lub brak uprawnień" };
    }

    const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const updated = await prisma.product.update({
      where: { id },
      data: { status: newStatus },
    });

    return { success: true, data: serializeProduct(updated) };
  } catch {
    return { success: false, error: "Wystąpił błąd podczas zmiany statusu produktu" };
  }
}
