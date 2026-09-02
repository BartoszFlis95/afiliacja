import type { ConversionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Domyka status Conversion po decyzji w sprawie prowizji.
 *
 * Commission i Conversion powstają razem w /api/track, ale nie mają
 * bezpośredniej relacji (łączy je tylko para affiliateLinkId + orderId) — bez
 * tego kroku Conversion.status zostaje na zawsze PENDING, a dashboardy,
 * statystyki i generowanie faktur filtrują właśnie po CONFIRMED/PAID.
 *
 * DLACZEGO TU, A NIE W src/actions:
 * to jest helper wywoływany wyłącznie po stronie serwera, z wnętrza innych
 * akcji. Trzymany jako `export` w pliku z dyrektywą "use server" był przez
 * Next rejestrowany jako pełnoprawny endpoint akcji serwerowej — czyli
 * dowolny klient mógł go wywołać z własnymi argumentami i bez żadnego
 * uwierzytelnienia ustawiać status konwersji. Zwykły moduł nie ma tego
 * problemu: nie da się go wywołać z zewnątrz.
 *
 * Autoryzację robią akcje, które go wołają (approve/reject prowizji oraz
 * transfer Stripe) — wszystkie trzy sprawdzają rolę przed dojściem tutaj.
 */
export async function syncConversionStatus(
  affiliateLinkId: string,
  orderId: string | null,
  status: ConversionStatus,
) {
  if (!orderId) return;

  await prisma.conversion.updateMany({
    where: { affiliateLinkId, orderId },
    data: { status },
  });
}
