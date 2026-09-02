import crypto from "node:crypto";

/**
 * Weryfikacja podpisu HMAC-SHA256 w czasie stałym.
 *
 * Wyciągnięte z /api/conversion do osobnego modułu z dwóch powodów: żeby dało
 * się to przetestować bez stawiania żądania HTTP, i żeby kolejny endpoint
 * przyjmujący webhooki nie musiał tego pisać od nowa (a przy przepisywaniu
 * łatwo wrócić do zwykłego `!==`).
 *
 * Zwykłe porównanie stringów przerywa na pierwszym różniącym się znaku, więc
 * czas odpowiedzi zdradza, ile początkowych znaków było poprawnych — to
 * pozwala odgadywać podpis bajt po bajcie zamiast łamać go w całości.
 */
export function verifyHmacSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");

  // timingSafeEqual rzuca przy różnych długościach, więc sprawdzamy je wcześniej.
  // Sama długość nie jest tajemnicą — HMAC SHA-256 w hex ma zawsze 64 znaki.
  if (received.length !== computed.length) return false;

  return crypto.timingSafeEqual(received, computed);
}
