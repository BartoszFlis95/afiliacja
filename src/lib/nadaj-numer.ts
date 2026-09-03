import { Prisma, PayoutStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatujNumerDokumentu } from "@/lib/numer-dokumentu";

const PREFIKS = "RC/";
const MAX_PROB = 5;

/** Wyciąga kolejny numer z "RC/2026/0042" -> 42. */
function pozycjaZNumeru(numer: string): number {
  const ostatni = numer.slice(numer.lastIndexOf("/") + 1);
  const n = Number.parseInt(ostatni, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Nadaje trwały numer rachunku, jeśli wypłata go jeszcze nie ma.
 *
 * Numer jest sekwencją księgową, nie pozycją wyliczaną z kolejności: raz
 * nadany nigdy się nie zmienia, nawet gdy requestedAt zostanie przestawione
 * przy ponowieniu po cofniętym transferze.
 *
 * Zwraca numer albo null, gdy wypłata nie jest jeszcze zrealizowana —
 * dokument powstaje dopiero dla COMPLETED.
 */
export async function nadajNumerDokumentu(payoutId: string): Promise<string | null> {
  for (let proba = 0; proba < MAX_PROB; proba++) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      select: { documentNumber: true, requestedAt: true, status: true },
    });
    if (!payout) return null;
    if (payout.documentNumber) return payout.documentNumber;
    if (payout.status !== PayoutStatus.COMPLETED) return null;

    const rok = payout.requestedAt.getFullYear();
    // sortujemy po kolumnie liczbowej, nie po tekście numeru: porównanie
    // tekstowe stawia "RC/2026/10000" przed "RC/2026/9999"
    const najwyzszy = await prisma.payout.findFirst({
      where: { documentNumber: { startsWith: `${PREFIKS}${rok}/` } },
      orderBy: { documentSeq: "desc" },
      select: { documentSeq: true, documentNumber: true },
    });

    const pozycja =
      (najwyzszy?.documentSeq ??
        (najwyzszy?.documentNumber ? pozycjaZNumeru(najwyzszy.documentNumber) : 0)) + 1;
    const numer = formatujNumerDokumentu(rok, pozycja);

    try {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { documentNumber: numer, documentSeq: pozycja },
      });
      return numer;
    } catch (error) {
      // P2002 = kolizja na unikalnym indeksie: równoległa wypłata zajęła ten
      // numer. Liczymy jeszcze raz — dlatego pętla, a nie pojedyncza próba.
      const kolizja =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!kolizja) throw error;
    }
  }

  console.error("[numeracja] nie udało się nadać numeru wypłacie", payoutId);
  return null;
}
