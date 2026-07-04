"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateProductImageAction(productId: string, imageUrl: string) {
  try {
    const session = await auth();
    const role = session?.user?.role as string | undefined;

    if (!session?.user?.id || !["BRAND", "ADMIN"].includes(role ?? "")) {
      return { success: false as const, error: "Brak dostępu" };
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return { success: false as const, error: "Produkt nie istnieje" };
    }

    if (role === "BRAND") {
      const brandProfile = await prisma.brandProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!brandProfile || product.brandProfileId !== brandProfile.id) {
        return { success: false as const, error: "Brak uprawnień do tego produktu" };
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: imageUrl || null },
    });

    return { success: true as const, data: { imageUrl: updated.imageUrl } };
  } catch {
    return { success: false as const, error: "Błąd aktualizacji zdjęcia" };
  }
}

export async function updateUserAvatarAction(avatarUrl: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Brak sesji" };
    }

    const role = session.user.role as string;

    if (role === "BRAND") {
      await prisma.brandProfile.update({
        where: { userId: session.user.id },
        data: { logoUrl: avatarUrl || null },
      });
    } else if (role === "INFLUENCER") {
      await prisma.influencerProfile.update({
        where: { userId: session.user.id },
        data: { avatarUrl: avatarUrl || null },
      });
    }

    return { success: true as const };
  } catch {
    return { success: false as const, error: "Błąd aktualizacji avataru" };
  }
}
