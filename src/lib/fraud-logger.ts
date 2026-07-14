/**
 * Centralny logger zdarzeń fraud detection.
 *
 * Na razie tylko console.warn — w przyszłości zapis do tabeli FraudLog
 * (audyt, dashboard admina z historią prób nadużyć).
 */
export function logFraud(type: string, details: object) {
  console.warn("[FRAUD]", type, JSON.stringify(details));
}
