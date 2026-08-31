import { prisma } from "@/lib/prisma";
import type { FraudType, Prisma } from "@prisma/client";

type LogFraudInput = {
  type: FraudType;
  reason: string;
  affiliateLinkId?: string | null;
  commissionId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Centralny logger zdarzeń fraud detection — trwały zapis do FraudLog.
 *
 * Nigdy nie rzuca: zapis audytowy nie może wywrócić głównego flow (kliknięcia,
 * rejestracji konwersji), więc błąd zapisu jest tylko logowany do konsoli.
 */
export async function logFraud(input: LogFraudInput): Promise<void> {
  try {
    await prisma.fraudLog.create({
      data: {
        type: input.type,
        reason: input.reason,
        affiliateLinkId: input.affiliateLinkId ?? null,
        commissionId: input.commissionId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error("[FRAUD] nie udało się zapisać FraudLog:", err, input);
  }
}
