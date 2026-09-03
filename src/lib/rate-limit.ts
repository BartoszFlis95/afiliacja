import { headers } from "next/headers";
import { Redis } from "@upstash/redis";

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
  email: { limit: 3, oknoMs: 60 * 60 * 1000 },
  logowanie: { limit: 10, oknoMs: 15 * 60 * 1000 },
  rejestracja: { limit: 5, oknoMs: 60 * 60 * 1000 },
} as const;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

// ---------------------------------------------------------------------------
// Backend współdzielony (Redis)
// ---------------------------------------------------------------------------

/**
 * Klient tworzony leniwie i tylko gdy obie zmienne są ustawione. Bez nich
 * limiter działa na pamięci procesu — poprawnie przy jednej instancji, ale
 * na serverless każda instancja liczy osobno.
 */
let redis: Redis | null = null;
let redisSprawdzony = false;

function getRedis(): Redis | null {
  if (redisSprawdzony) return redis;
  redisSprawdzony = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}

// ---------------------------------------------------------------------------
// Backend zapasowy (pamięć procesu)
// ---------------------------------------------------------------------------

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Górny limit liczby śledzonych kluczy. Bez niego mapa rośnie z każdym nowym
 * adresem IP i nic jej nie ogranicza w obrębie okna — a rotowanie adresów jest
 * trywialne (botnet, IPv6). Limiter sam stawał się wtedy wektorem DoS.
 */
const MAX_KEYS = 10_000;

/**
 * Sprzątanie amortyzowane. Przechodzenie całej mapy przy KAŻDYM wywołaniu
 * dawało koszt kwadratowy: zmierzone 7 ms dla 1000 różnych IP, 298 ms dla
 * 10 000 i 8549 ms dla 50 000. Teraz przechodzimy ją dopiero po przekroczeniu
 * progu, a gdy po usunięciu wygasłych nadal jest za duża, kasujemy najstarsze
 * wpisy (Map zachowuje kolejność wstawiania).
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

function wPamieci(key: string, limit: number, oknoMs: number): RateLimitResult {
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

// ---------------------------------------------------------------------------

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

/**
 * Sprawdza i zwiększa licznik dla klucza.
 *
 * Na Redisie: INCR, a przy pierwszym trafieniu PEXPIRE ustawiające okno.
 * INCR jest atomowy, więc dwie instancje zwiększające ten sam licznik
 * jednocześnie nie zgubią żadnej próby — to jest właśnie powód, dla którego
 * przechodzimy na współdzielony backend.
 *
 * GDY REDIS ZAWIEDZIE, schodzimy na licznik w pamięci zamiast odrzucać
 * żądanie. Rate limiting jest siatką bezpieczeństwa, nie bramką — awaria
 * Redisa nie może zamienić się w awarię logowania dla wszystkich.
 */
export async function checkRateLimit(
  key: string,
  limit: number = MAX_ATTEMPTS,
  oknoMs: number = WINDOW_MS,
): Promise<RateLimitResult> {
  const client = getRedis();
  if (!client) return wPamieci(key, limit, oknoMs);

  try {
    const pelnyKlucz = `rl:${key}`;
    const licznik = await client.incr(pelnyKlucz);

    // Okno ustawiamy tylko przy pierwszym trafieniu — inaczej każda kolejna
    // próba przesuwałaby koniec okna i nikt nigdy by się nie odblokował.
    if (licznik === 1) {
      await client.pexpire(pelnyKlucz, oknoMs);
      return { allowed: true };
    }

    if (licznik > limit) {
      const ttl = await client.pttl(pelnyKlucz);
      // -1 oznacza klucz bez TTL (nie powinno wystąpić, ale gdyby PEXPIRE
      // przepadło, klucz zostałby na zawsze i zablokował adres na stałe).
      if (ttl < 0) {
        await client.pexpire(pelnyKlucz, oknoMs);
        return { allowed: false, retryAfterMs: oknoMs };
      }
      return { allowed: false, retryAfterMs: ttl };
    }

    return { allowed: true };
  } catch (error) {
    console.error("[rate-limit] Redis niedostępny, licznik w pamięci:", error);
    return wPamieci(key, limit, oknoMs);
  }
}
