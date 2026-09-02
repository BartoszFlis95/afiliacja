import { headers } from "next/headers";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

type Bucket = { count: number; resetAt: number };

// In-memory — resetuje się przy restarcie/redeployu procesu i nie jest
// współdzielony między instancjami. Wystarczające jako pierwsza linia
// obrony przed spamem na jednej instancji; przy skalowaniu poziomym
// docelowo trzeba przenieść do współdzielonego store (np. Redis).
const buckets = new Map<string, Bucket>();

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(
  key: string
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}
