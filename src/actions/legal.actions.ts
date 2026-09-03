"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WERSJA_REGULAMINU } from "@/lib/legal";

type Wynik = { success: true } | { success: false; error: string };

/**
 * Zapisuje akceptację dokumentów prawnych przez zalogowanego użytkownika.
 *
 * Bramka stoi w layoucie panelu, a nie w middleware: middleware widzi tylko
 * token JWT, więc data akceptacji byłaby w nim nieaktualna zaraz po zapisie,
 * a projekt nie używa useSession, którym dałoby się token odświeżyć —
 * użytkownik zostałby odesłany na tę stronę w kółko.
 */
export async function acceptTermsAction(
  tosAccepted: boolean,
  privacyAccepted: boolean,
): Promise<Wynik> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Brak sesji." };

  if (!tosAccepted || !privacyAccepted) {
    return {
      success: false,
      error: "Musisz zaakceptować oba dokumenty, aby korzystać z platformy.",
    };
  }

  const teraz = new Date();
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      tosAcceptedAt: teraz,
      privacyAcceptedAt: teraz,
      tosVersion: WERSJA_REGULAMINU,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
