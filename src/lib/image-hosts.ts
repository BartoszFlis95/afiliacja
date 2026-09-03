/**
 * Jedyne źródło prawdy o hostach obrazów.
 *
 * Ta sama lista zasila `images.remotePatterns` w next.config.ts oraz walidację
 * URL-i przyjmowanych przez akcje serwerowe. Trzymanie jej w dwóch miejscach
 * kończyło się tym, że akcja przyjmowała adres, którego <Image> nie potrafił
 * potem wyrenderować — a next/image na hoście spoza listy nie degraduje się
 * po cichu, tylko rzuca wyjątkiem. Zdjęcie produktu renderuje się w publicznym
 * katalogu, więc jeden zły adres wywracał stronę wszystkim odwiedzającym.
 */

export const DOZWOLONE_HOSTY = [
  "lh3.googleusercontent.com", // awatary Google OAuth
  "avatars.githubusercontent.com", // awatary GitHub OAuth
  "pub-0047fe05b86f46949b2dab328b219e47.r2.dev", // Cloudflare R2 (bucket projektu)
  "*.r2.dev", // Cloudflare R2 (pozostałe buckety)
] as const;

export const remotePatterns = DOZWOLONE_HOSTY.map((hostname) => ({
  protocol: "https" as const,
  hostname,
}));

/** Czy host pasuje do wzorca z listy (obsługuje jeden wiodący `*.`). */
function hostPasuje(host: string, wzorzec: string): boolean {
  if (!wzorzec.startsWith("*.")) return host === wzorzec;
  const sufiks = wzorzec.slice(1); // "*.r2.dev" -> ".r2.dev"
  // wymagamy etykiety przed sufiksem, żeby samo "r2.dev" nie przechodziło
  return host.endsWith(sufiks) && host.length > sufiks.length;
}

/**
 * Czy adres nadaje się do zapisania jako URL obrazu.
 * Odrzuca wszystko, czego <Image> i tak by nie wyrenderował.
 */
export function dozwolonyUrlObrazu(url: string): boolean {
  if (url.length > 2048) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;
  return DOZWOLONE_HOSTY.some((w) => hostPasuje(parsed.hostname, w));
}
