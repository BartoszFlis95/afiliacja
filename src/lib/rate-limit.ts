import { headers } from "next/headers";

/**
 * Domyślne okno: akcje wysyłające maile (reset hasła, ponowna weryfikacja).
 * Tam koszt nadużycia ponosimy my — każde wywołanie to mail przez Resend.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

/**
 * Progi per akcja. Logowanie ma inne wymagania niż wysyłka maila: ludzie
 * mylą hasła, więc 3 próby na godzinę zablokowałyby prawdziwych użytkowników.
 * Dodatkowo każda próba kosztuje atakującego ok. 250 ms (bcrypt, 12 rund),
 * więc samo zgadywanie jest już spowolnione — limit ma uciąć automat, nie
 * ukarać kogoś, kto pomylił się trzy razy.
 */
export const PROGI = {
  email:    { limit: 3,  oknoMs: 60 * 60 * 1000 },
  logowanie:{ limit: 10, oknoMs: 15 * 60 * 1000 },
  rejestracja: { limit: 5, oknoMs: 60 * 60 * 1000 },
} as const;

type Bucket = { count: number; resetAt: number };

// In-memory — resetuje się przy restarcie/redeployu procesu i nie jest
// współdzielony między instancjami. Wystarczające jako pierwsza linia
// obrony przed spamem na jednej instancji; przy skalowaniu poziomym
// docelowo trzeba przenieść do współdzielonego store (np. Redis).
const buckets = new Map<string, Bucket>();

/**
 * Górny limit liczby śledzonych kluczy. Bez niego mapa rośnie z każdym nowym
 * adresem IP i nic jej nie ogranicza w obrębie okna — a rotowanie adresów jest
 * trywialne (botnet, IPv6). Limiter sam stawał się wtedy wektorem DoS.
 */
const MAX_KEYS = 10_000;

/**
 * Sprzątanie amortyzowane.
 *
 * Poprzednia wersja przechodziła całą mapę przy KAŻDYM wywołaniu. Ponieważ
 * w oknie godzinnym nic nie wygasa, mapa tylko rosła, a koszt był kwadratowy:
 * zmierzone 7 ms dla 1000 różnych IP, 298 ms dla 10 000 i 8549 ms dla 50 000.
 * Teraz przechodzimy ją dopiero po przekroczeniu progu, a gdy po usunięciu
 * wygasłych nadal jest za duża, kasujemy najstarsze wpisy (Map zachowuje
 * kolejność wstawiania). To poświęca odrobinę dokładności przy skrajnym
 * natężeniu ruchu na rzecz stałego kosztu — kompromis właściwy dla obrony,
 * która sama nie może być kosztem.
 */
function pruneExpired(now: number) {
  if (buckets.size < MAX_KEYS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  if (buckets.size >= MAX_KEYS) {
    const doUsuniecia = buckets.size - Math.floor(MAX_KEYS / 2);
    let i = 0;
    for (const key of buckets.keys()) {
      if (i++ >= doUsuniecia) break;
      buckets.delete(key);
    }
  }
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/**
 * Funkcja jest `async` mimo że obecna implementacja niczego nie czeka.
 *
 * To celowe: docelowy backend (Redis/Upstash) jest z natury asynchroniczny,
 * a zmiana sygnatury z synchronicznej na asynchroniczną dotknęłaby KAŻDEGO
 * miejsca wywołania. Dziś to cztery miejsca, wszystkie i tak w funkcjach
 * async — więc koszt jest zerowy. Później byłby to refaktor przez cały kod
 * autoryzacji, robiony pod presją.
 *
 * Dzięki temu podmiana wnętrza na Redis to zmiana w JEDNYM pliku.
 */
export async function checkRateLimit(
  key: string,
  limit: number = MAX_ATTEMPTS,
  oknoMs: number = WINDOW_MS
): Promise<RateLimitResult> {
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + oknoMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}
