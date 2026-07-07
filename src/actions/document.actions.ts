// src/actions/document.actions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type InfluencerDocument = {
  id: string;
  number: string;
  type: "RECEIPT";
  period: Date;
  netAmount: number;
  status: string;
  productName: string | null;
  requestedAt: Date;
  processedAt: Date | null;
};

async function requireInfluencer() {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    return null;
  }
  return session;
}

/**
 * Dokumenty nie są jeszcze osobną tabelą w bazie — platforma nie generuje
 * jeszcze prawdziwych faktur/rachunków (patrz BillingTypeForm: "Wkrótce
 * dostępne"). Do czasu wdrożenia tej funkcji lista dokumentów jest
 * wyprowadzana z historii wypłat (Payout) influencera: każda wypłata
 * odpowiada jednemu rachunkowi.
 */
export async function getMyDocumentsAction(): Promise<ActionResult<InfluencerDocument[]>> {
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

  const payouts = await prisma.payout.findMany({
    where: { influencerId: profile.id },
    include: {
      commission: { include: { product: { select: { name: true } } } },
    },
    orderBy: { requestedAt: "asc" },
  });

  const yearSeq = new Map<number, number>();
  const documents: InfluencerDocument[] = payouts.map((payout) => {
    const year = payout.requestedAt.getFullYear();
    const seq = (yearSeq.get(year) ?? 0) + 1;
    yearSeq.set(year, seq);

    return {
      id: payout.id,
      number: `RC/${year}/${String(seq).padStart(4, "0")}`,
      type: "RECEIPT",
      period: payout.commission.createdAt,
      netAmount: Number(payout.amount),
      status: payout.status,
      productName: payout.commission.product?.name ?? null,
      requestedAt: payout.requestedAt,
      processedAt: payout.processedAt,
    };
  });

  documents.reverse();

  return { success: true, data: documents };
}
