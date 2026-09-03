import { prisma } from "@/lib/prisma";

/**
 * Heurystyki oznaczania podejrzanych konwersji.
 *
 * Wyciągnięte ze wspólnego kodu /api/track i /api/conversion — obie trasy
 * miały własną, niemal identyczną kopię, więc poprawka w jednej nie trafiała
 * do drugiej.
 *
 * Konwersji NIE BLOKUJEMY. Flaga trafia na Commission.isSuspicious i do
 * FraudLog, do ręcznej weryfikacji przez markę lub admina. To świadomy
 * kompromis: fałszywie dodatnia blokada kosztuje uczciwego influencera
 * pieniądze i zaufanie, a oznaczenie kosztuje tylko chwilę uwagi admina.
 */

/** Ile razy wartość zamówienia musi przekroczyć odniesienie, żeby wzbudzić podejrzenie. */
const KROTNOSC_PROGU = 100;

/** Ile konwersji z jednego adresu IP w oknie 24 h uznajemy za podejrzane. */
const KONWERSJE_Z_IP_24H = 5;

export type WynikHeurystyk = {
  isSuspicious: boolean;
  suspiciousReason: string | null;
  powody: string[];
};

export async function oznaczPodejrzanaKonwersje(params: {
  affiliateLinkId: string;
  orderValue: number;
  /** Cena katalogowa produktu, jeśli marka ją podała. */
  productPrice: number | null;
  /** IP powiązane z konwersją — patrz uwaga o atrybucji niżej. */
  clickIp: string | null;
}): Promise<WynikHeurystyk> {
  const { affiliateLinkId, orderValue, productPrice, clickIp } = params;
  const powody: string[] = [];

  /**
   * ODNIESIENIE 1 — cena katalogowa produktu.
   *
   * Ważniejsze od średniej, bo ceny NIE DA SIĘ podnieść konwersjami: ustala ją
   * marka. Średnia z konwersji sama się rozbraja (patrz niżej), więc to jest
   * jedyne odniesienie odporne na stopniowe rozgrzewanie.
   */
  if (productPrice && productPrice > 0 && orderValue > productPrice * KROTNOSC_PROGU) {
    powody.push(
      `Wartość zamówienia ${KROTNOSC_PROGU}x powyżej ceny katalogowej produktu`,
    );
  }

  /**
   * ODNIESIENIE 2 — średnia z poprzednich konwersji tego linku.
   *
   * Z JEDNĄ POPRAWKĄ: średnia liczona jest TYLKO z konwersji nieoznaczonych
   * jako podejrzane. Wcześniej obejmowała wszystkie, więc każda przyjęta
   * oszukańcza konwersja podnosiła próg dla następnej. Zmierzone na modelu:
   * startowy limit 10 000 zł dawało się w czterech krokach rozgrzać do
   * 9,2 mld zł i żadna z tych konwersji nie zostawała oznaczona.
   */
  // Średnią liczymy z Commission, nie z Conversion: te dwa modele nie mają
  // bezpośredniej relacji (łączy je tylko para affiliateLinkId + orderId),
  // a flaga isSuspicious i orderValue są właśnie na Commission.
  const podstawa = await prisma.commission.aggregate({
    where: { affiliateLinkId, isSuspicious: false },
    _avg: { orderValue: true },
  });

  const sredniaRaw = podstawa._avg?.orderValue;
  const srednia = sredniaRaw ? Number(sredniaRaw) : null;
  if (srednia && orderValue > srednia * KROTNOSC_PROGU) {
    powody.push(`Wartość zamówienia ${KROTNOSC_PROGU}x powyżej średniej dla tego linku`);
  }

  /**
   * ODNIESIENIE 3 — wiele konwersji z tego samego adresu IP.
   *
   * OGRANICZENIE, KTÓRE TRZEBA ZNAĆ: `clickIp` to adres OSTATNIEGO KLIKNIĘCIA
   * w ten link, przez kogokolwiek — nie adres kupującego. Webhook konwersji
   * przychodzi z serwera marki i nie zawiera IP klienta, więc Deneeu go nie
   * zna. Ta heurystyka wykrywa więc "wiele konwersji na linkach, w które
   * ostatnio kliknięto z tego samego adresu", a nie "wiele zakupów przez
   * jedną osobę". Łapie prymitywny scenariusz (jeden atakujący, jeden adres),
   * ale rotacja adresów przy klikaniu omija ją w całości.
   *
   * Rzetelne wykrywanie wymagałoby, żeby marka przesyłała IP kupującego
   * w webhooku — to zmiana kontraktu API i decyzja produktowa.
   */
  if (clickIp) {
    const od = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const liczba = await prisma.commission.count({
      where: { ipAddress: clickIp, createdAt: { gte: od } },
    });
    if (liczba >= KONWERSJE_Z_IP_24H) {
      powody.push(
        `Więcej niż ${KONWERSJE_Z_IP_24H} konwersji powiązanych z tym adresem IP w ciągu 24h`,
      );
    }
  }

  return {
    isSuspicious: powody.length > 0,
    suspiciousReason: powody.length > 0 ? powody.join("; ") : null,
    powody,
  };
}
