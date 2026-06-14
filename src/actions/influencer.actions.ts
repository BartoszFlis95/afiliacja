// src/actions/influencer.actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Nazwa wyświetlana jest wymagana"),
  bio: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().url("Nieprawidłowy URL").optional().or(z.literal("")),
  instagramUrl: z.string().trim().url("Nieprawidłowy URL").optional().or(z.literal("")),
  youtubeUrl: z.string().trim().url("Nieprawidłowy URL").optional().or(z.literal("")),
  tiktokUrl: z.string().trim().url("Nieprawidłowy URL").optional().or(z.literal("")),
  followersCount: z.coerce.number().int().min(0).optional(),
});

function normalize(input: z.infer<typeof profileSchema>) {
  return {
    displayName: input.displayName,
    bio: input.bio || null,
    website: input.website || null,
    instagramUrl: input.instagramUrl || null,
    youtubeUrl: input.youtubeUrl || null,
    tiktokUrl: input.tiktokUrl || null,
    followersCount: input.followersCount ?? 0,
  };
}

async function requireInfluencer() {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    return null;
  }
  return session;
}

export async function createInfluencerProfileAction(
  formData: unknown,
): Promise<ActionResult> {
  const session = await requireInfluencer();
  if (!session?.user?.id) {
    return { success: false, error: "Brak autoryzacji" };
  }

  const parsed = profileSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  const existing = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: "Profil już istnieje" };
  }

  const profile = await prisma.influencerProfile.create({
    data: {
      userId: session.user.id,
      ...normalize(parsed.data),
    },
  });

  revalidatePath("/influencer/dashboard");
  revalidatePath("/influencer/settings");

  return { success: true, data: profile };
}

export async function updateInfluencerProfileAction(
  formData: unknown,
): Promise<ActionResult> {
  const session = await requireInfluencer();
  if (!session?.user?.id) {
    return { success: false, error: "Brak autoryzacji" };
  }

  const parsed = profileSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  const existing = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return { success: false, error: "Profil nie istnieje" };
  }

  const profile = await prisma.influencerProfile.update({
    where: { userId: session.user.id },
    data: normalize(parsed.data),
  });

  revalidatePath("/influencer/settings");
  revalidatePath("/influencer/dashboard");

  return { success: true, data: profile };
}

export async function getInfluencerStatsAction(): Promise<ActionResult> {
  const session = await requireInfluencer();
  if (!session?.user?.id) {
    return { success: false, error: "Brak autoryzacji" };
  }

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return { success: false, error: "Profil nie istnieje" };
  }

  const aggregate = await prisma.affiliateLink.aggregate({
    where: { influencerProfileId: profile.id },
    _sum: {
      totalClicks: true,
      totalConversions: true,
      totalEarnings: true,
    },
  });

  const totalClicks = aggregate._sum.totalClicks ?? 0;
  const totalConversions = aggregate._sum.totalConversions ?? 0;
  const totalEarnings = Number(aggregate._sum.totalEarnings ?? 0);
  const conversionRate =
    totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  return {
    success: true,
    data: { totalClicks, totalConversions, totalEarnings, conversionRate },
  };
}

export async function generateAffiliateLinkAction(
  productId: string,
): Promise<ActionResult> {
  try {
    const session = await requireInfluencer();
    if (!session?.user?.id) {
      return { success: false, error: "Brak autoryzacji" };
    }

    if (!productId) {
      return { success: false, error: "Brak identyfikatora produktu" };
    }

    const profile = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) {
      return { success: false, error: "Najpierw uzupełnij profil influencera" };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });
    if (!product || product.status !== "ACTIVE") {
      return { success: false, error: "Produkt niedostępny" };
    }

    // Kod kryptograficznie bezpieczny (UUID v4 bez myślników, pierwsze 10 znaków)
    const code = crypto.randomUUID().replace(/-/g, "").substring(0, 10);

    // Atomowy upsert — chroni przed duplikatami nawet przy równoległych żądaniach
    const link = await prisma.affiliateLink.upsert({
      where: {
        influencerProfileId_productId: {
          influencerProfileId: profile.id,
          productId,
        },
      },
      update: {},
      create: {
        influencerProfileId: profile.id,
        productId,
        code,
      },
    });

    revalidatePath("/influencer/products");
    revalidatePath("/influencer/links");

    return {
      success: true,
      data: {
        id:                  link.id,
        code:                link.code,
        influencerProfileId: link.influencerProfileId,
        productId:           link.productId,
        totalClicks:         link.totalClicks,
        totalConversions:    link.totalConversions,
        totalEarnings:       Number(link.totalEarnings),
        createdAt:           link.createdAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Błąd generowania linku",
    };
  }
}
