/**
 * Serializacja danych strukturalnych do wstawienia w <script type="application/ld+json">.
 *
 * JSON.stringify NIE escapuje "<". Nazwa produktu zawierająca
 * </script><script>...</script> wychodziła ze znacznika i wykonywała się
 * u każdego odwiedzającego publiczną stronę produktu — a treść ustawia marka.
 *
 * Zamiana "<" na < jest poprawnym escapem JSON-a: po sparsowaniu wraca
 * dokładnie ten sam ciąg, więc wyszukiwarki widzą niezmienione dane.
 */
export function bezpieczneJsonLd(dane: unknown): string {
  return JSON.stringify(dane).replace(/</g, "\\u003c");
}
