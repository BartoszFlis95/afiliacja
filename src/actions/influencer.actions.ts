// src/actions/influencer.actions.ts
"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { zawezZakres } from "@/lib/zakres-dni";
import { auth } from "@/lib/auth";
import { BankDetailsSchema } from "@/lib/validations/bank.schema";
import { InfluencerProfileSchema } from "@/lib/validations/profile.schema";
import { CommissionStatus } from "@prisma/client";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};


function normalize(input: z.infer<typeof InfluencerProfileSchema>) {
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

  const parsed = InfluencerProfileSchema.safeParse(formData);
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

  const parsed = InfluencerProfileSchema.safeParse(formData);
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

export interface InfluencerRangeStats {
  dailyClicks: { date: string; clicks: number }[];
  earningsByProduct: { label: string; value: number }[];
  links: {
    id: string;
    productName: string;
    clicks: number;
    conversions: number;
    conversionRate: number;
    earnings: number;
  }[];
}

export async function getInfluencerRangeStatsAction(
  days: 7 | 30 | 90
): Promise<ActionResult<InfluencerRangeStats>> {
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

  // ograniczamy raz i dalej używamy wyłącznie tej wartości — inaczej data
  // byłaby bezpieczna, a pętla budująca kubełki poniżej nadal nieograniczona
  const zakres = zawezZakres(days);

  const from = new Date();
  from.setDate(from.getDate() - (zakres - 1));
  from.setHours(0, 0, 0, 0);

  const [links, clicks, commissions] = await Promise.all([
    prisma.affiliateLink.findMany({
      where: { influencerProfileId: profile.id },
      include: { product: { select: { name: true } } },
    }),
    prisma.click.findMany({
      where: { affiliateLink: { influencerProfileId: profile.id }, createdAt: { gte: from } },
      select: { affiliateLinkId: true, createdAt: true },
    }),
    prisma.commission.findMany({
      where: { influencerId: profile.id, createdAt: { gte: from } },
      select: {
        affiliateLinkId: true,
        commissionAmount: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < zakres; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  const clicksByLink = new Map<string, number>();
  for (const click of clicks) {
    const key = click.createdAt.toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    clicksByLink.set(click.affiliateLinkId, (clicksByLink.get(click.affiliateLinkId) ?? 0) + 1);
  }
  const dailyClicks = Array.from(dailyMap.entries()).map(([date, clicksCount]) => ({
    date,
    clicks: clicksCount,
  }));

  const conversionsByLink = new Map<string, number>();
  const earningsByLink = new Map<string, number>();
  const earningsByProductMap = new Map<string, number>();
  for (const c of commissions) {
    const amount = Number(c.commissionAmount);
    conversionsByLink.set(c.affiliateLinkId, (conversionsByLink.get(c.affiliateLinkId) ?? 0) + 1);
    earningsByLink.set(c.affiliateLinkId, (earningsByLink.get(c.affiliateLinkId) ?? 0) + amount);
    const productName = c.product?.name ?? "—";
    earningsByProductMap.set(productName, (earningsByProductMap.get(productName) ?? 0) + amount);
  }

  const linkRows = links.map((link) => {
    const linkClicks = clicksByLink.get(link.id) ?? 0;
    const linkConversions = conversionsByLink.get(link.id) ?? 0;
    return {
      id: link.id,
      productName: link.product?.name ?? "—",
      clicks: linkClicks,
      conversions: linkConversions,
      conversionRate: linkClicks > 0 ? (linkConversions / linkClicks) * 100 : 0,
      earnings: earningsByLink.get(link.id) ?? 0,
    };
  });

  const earningsByProduct = Array.from(earningsByProductMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return { success: true, data: { dailyClicks, earningsByProduct, links: linkRows } };
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

// ---------------------------------------------------------------------------
// BANK DETAILS
// ---------------------------------------------------------------------------

export type BankDetailsData = {
  hasBankDetails: boolean;
  preferredPayout: string | null;
  bankAccountName: string | null;
  bankAccountIban: string | null;
  bankAccountBank: string | null;
  bankSwift: string | null;
  paypalEmail: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
};

export async function getBankDetailsAction(): Promise<ActionResult<BankDetailsData>> {
  const session = await requireInfluencer();
  if (!session?.user?.id) {
    return { success: false, error: "Brak autoryzacji" };
  }

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      preferredPayout: true,
      bankAccountName: true,
      bankAccountIban: true,
      bankAccountBank: true,
      bankSwift: true,
      paypalEmail: true,
      phone: true,
      city: true,
      country: true,
    },
  });

  if (!profile) {
    return { success: false, error: "Profil nie istnieje" };
  }

  const hasBankDetails =
    (profile.preferredPayout === "bank" && !!profile.bankAccountIban) ||
    (profile.preferredPayout === "paypal" && !!profile.paypalEmail);

  return {
    success: true,
    data: {
      hasBankDetails,
      preferredPayout: profile.preferredPayout,
      bankAccountName: profile.bankAccountName,
      bankAccountIban: profile.bankAccountIban,
      bankAccountBank: profile.bankAccountBank,
      bankSwift: profile.bankSwift,
      paypalEmail: profile.paypalEmail,
      phone: profile.phone,
      city: profile.city,
      country: profile.country,
    },
  };
}

export async function updateBankDetailsAction(
  formData: unknown
): Promise<ActionResult> {
  const session = await requireInfluencer();
  if (!session?.user?.id) {
    return { success: false, error: "Brak autoryzacji" };
  }

  const parsed = BankDetailsSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane",
    };
  }

  const data = parsed.data;

  const normalizedIban =
    data.preferredPayout === "bank"
      ? data.bankAccountIban.replace(/\s/g, "").toUpperCase()
      : null;

  await prisma.influencerProfile.update({
    where: { userId: session.user.id },
    data: {
      preferredPayout: data.preferredPayout,
      phone: data.phone || null,
      city: data.city || null,
      country: data.country || null,
      bankAccountName: data.preferredPayout === "bank" ? data.bankAccountName : null,
      bankAccountIban: normalizedIban,
      bankAccountBank: data.preferredPayout === "bank" ? data.bankAccountBank : null,
      bankSwift: data.preferredPayout === "bank" ? (data.bankSwift || null) : null,
      paypalEmail: data.preferredPayout === "paypal" ? data.paypalEmail : null,
    },
  });

  revalidatePath("/influencer/settings");
  revalidatePath("/influencer/dashboard");
  revalidatePath("/influencer/commissions");

  return { success: true };
}

// ---------------------------------------------------------------------------
// BILLING TYPE
// ---------------------------------------------------------------------------

export async function updateBillingTypeAction(
  billingType: "INDIVIDUAL" | "COMPANY"
): Promise<ActionResult> {
  const session = await requireInfluencer();
  if (!session?.user?.id) {
    return { success: false, error: "Brak autoryzacji" };
  }

  if (billingType !== "INDIVIDUAL" && billingType !== "COMPANY") {
    return { success: false, error: "Nieprawidłowy typ rozliczenia" };
  }

  /**
   * Po utworzeniu konta Stripe typu rozliczenia nie da się już bezpiecznie
   * zmienić po naszej stronie.
   *
   * Konto Connect zakładane jest z business_type odpowiadającym tej deklaracji
   * (individual albo company) i Stripe nie pozwala przestawić tego po
   * rozpoczęciu weryfikacji. Ciche zapisanie nowej wartości u nas dałoby
   * rozjazd: my wystawialibyśmy dokumenty jak firmie, a Stripe traktowałby
   * konto jako osobę fizyczną — rozjazd wyszedłby dopiero przy wypłacie,
   * odrzuconej lub zatrzymanej do wyjaśnienia.
   */
  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { billingType: true, stripeAccountId: true },
  });

  if (
    profile?.stripeAccountId &&
    profile.billingType &&
    profile.billingType !== billingType
  ) {
    return {
      success: false,
      error:
        "Nie można zmienić typu rozliczenia po utworzeniu konta Stripe — " +
        "konto jest zarejestrowane pod poprzedni typ. Skontaktuj się z nami, " +
        "żeby przejść przez tę zmianę.",
    };
  }

  await prisma.influencerProfile.update({
    where: { userId: session.user.id },
    data: { billingType },
  });

  revalidatePath("/influencer/settings");

  return { success: true };
}

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const session = await requireInfluencer();
  if (!session?.user?.id) {
    return { success: false, error: "Brak autoryzacji" };
  }

  if (data.newPassword !== data.confirmPassword) {
    return { success: false, error: "Hasła nie są zgodne" };
  }

  if (data.newPassword.length < 8) {
    return { success: false, error: "Nowe hasło musi mieć co najmniej 8 znaków" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { success: false, error: "Konto nie ma ustawionego hasła" };
  }

  const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Aktualne hasło jest nieprawidłowe" };
  }

  const newHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}

export type SaldoInfluencera = {
  zarobioneLacznie: number;
  doWyplaty: number;
  zablokowane: number;
  wyplacone: number;
};

/**
 * Saldo z podziałem na środki dostępne i zamrożone.
 *
 * „Zablokowane” to prowizje zatwierdzone, których faktura nie została jeszcze
 * opłacona przez markę — influencer widzi je jako zarobione, ale nie może ich
 * jeszcze wypłacić. Rozdzielenie tych kwot jest istotne: bez niego saldo
 * obiecywałoby pieniądze, których nie da się pobrać.
 */
export async function getInfluencerBalanceAction(): Promise<ActionResult<SaldoInfluencera>> {
  const session = await requireInfluencer();
  if (!session?.user?.id) return { success: false, error: "Brak autoryzacji" };

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "Profil nie istnieje" };

  const prowizje = await prisma.commission.findMany({
    where: {
      influencerId: profile.id,
      status: { in: [CommissionStatus.APPROVED, CommissionStatus.PAID] },
    },
    select: {
      commissionAmount: true,
      status: true,
      invoice: { select: { payoutsTriggered: true } },
    },
  });

  let zarobioneLacznie = 0;
  let doWyplaty = 0;
  let zablokowane = 0;
  let wyplacone = 0;

  for (const p of prowizje) {
    const kwota = Number(p.commissionAmount);
    zarobioneLacznie += kwota;

    if (p.status === CommissionStatus.PAID) {
      wyplacone += kwota;
      continue;
    }
    if (p.invoice?.payoutsTriggered) {
      doWyplaty += kwota;
    } else {
      zablokowane += kwota;
    }
  }

  const zaokr = (v: number) => Math.round(v * 100) / 100;
  return {
    success: true,
    data: {
      zarobioneLacznie: zaokr(zarobioneLacznie),
      doWyplaty: zaokr(doWyplaty),
      zablokowane: zaokr(zablokowane),
      wyplacone: zaokr(wyplacone),
    },
  };
}
