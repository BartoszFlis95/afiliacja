/**
 * Jedno miejsce, które wie, co jest skonfigurowane.
 *
 * DLACZEGO TO ISTNIEJE: w tym projekcie brakująca zmienna środowiskowa nie
 * powodowała błędu, tylko po cichu produkowała zepsute zachowanie. Trzy
 * znalezione przypadki tego samego wzorca:
 *   - brak RESEND_FROM_EMAIL  -> nagłówek From "undefined <undefined>",
 *                                każdy mail odrzucany przez Resend
 *   - brak DENEEU_ISSUER_NIP  -> NIP "0000000000" na fakturze VAT, dokument
 *                                nieważny, nabywca nie odliczy podatku
 *   - brak NEXT_PUBLIC_APP_URL -> linki resetu hasła na apex zamiast www,
 *                                token ginie przy przekierowaniu
 * Do tego STRIPE_SECRET_KEY ma fallback "sk_missing_key": wypłaty nie padają
 * przy starcie, tylko przy pierwszym przelewie, z komunikatem nieprowadzącym
 * do przyczyny.
 *
 * CELOWO NIE RZUCA PRZY IMPORCIE. Moduły korzystające ze zmiennych są
 * importowane w czasie builda (zbieranie danych stron), więc wyjątek przy
 * imporcie wywaliłby build każdemu, kto nie ma kompletu sekretów lokalnie.
 * Zamiast tego: raport, głośne ostrzeżenie na produkcji i osobna komenda
 * `npm run check:env` do bramki w CI/deployu.
 */

type Grupa = {
  nazwa: string;
  /** Co przestaje działać bez tej grupy. */
  konsekwencja: string;
  zmienne: string[];
};

export const GRUPY: Grupa[] = [
  {
    nazwa: "rdzeń",
    konsekwencja: "aplikacja nie wstanie",
    zmienne: ["DATABASE_URL", "AUTH_SECRET"],
  },
  {
    nazwa: "e-maile",
    konsekwencja:
      "nie wyjdzie żaden mail: weryfikacja konta i reset hasła przestają działać",
    zmienne: ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_FROM_NAME"],
  },
  {
    nazwa: "adres publiczny",
    konsekwencja:
      "linki w mailach wskażą domenę zapasową; token resetu hasła może zginąć przy przekierowaniu",
    zmienne: ["NEXT_PUBLIC_APP_URL"],
  },
  {
    nazwa: "wypłaty (Stripe)",
    konsekwencja: "nie da się wypłacić prowizji influencerom",
    zmienne: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  },
  {
    nazwa: "faktury",
    konsekwencja: "wystawianie faktur jest zablokowane (celowo — patrz lib/site.ts)",
    zmienne: [
      "DENEEU_ISSUER_NAME",
      "DENEEU_ISSUER_NIP",
      "DENEEU_ISSUER_ADDRESS",
      "DENEEU_ISSUER_CITY",
      "DENEEU_ISSUER_POSTAL_CODE",
      "DENEEU_BANK_ACCOUNT",
    ],
  },
  {
    nazwa: "przechowywanie plików (R2)",
    konsekwencja: "wgrywanie zdjęć produktów i avatarów przestaje działać",
    zmienne: [
      "CLOUDFLARE_R2_ACCOUNT_ID",
      "CLOUDFLARE_R2_ACCESS_KEY_ID",
      "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
      "CLOUDFLARE_R2_BUCKET_NAME",
      "CLOUDFLARE_R2_PUBLIC_URL",
    ],
  },
  {
    nazwa: "współdzielony limiter (Redis)",
    konsekwencja:
      "rate limiting działa, ale w pamięci procesu — na wielu instancjach każda liczy osobno",
    zmienne: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  },
];

export type RaportGrupy = {
  nazwa: string;
  konsekwencja: string;
  brakujace: string[];
  kompletna: boolean;
};

export function sprawdzKonfiguracje(
  env: NodeJS.ProcessEnv = process.env,
): RaportGrupy[] {
  return GRUPY.map((g) => {
    const brakujace = g.zmienne.filter((v) => !env[v]?.trim());
    return {
      nazwa: g.nazwa,
      konsekwencja: g.konsekwencja,
      brakujace,
      kompletna: brakujace.length === 0,
    };
  });
}

/** Czy dana grupa jest w pełni skonfigurowana — do bramek w kodzie funkcji. */
export function grupaSkonfigurowana(
  nazwa: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const g = GRUPY.find((x) => x.nazwa === nazwa);
  if (!g) throw new Error(`Nieznana grupa konfiguracji: ${nazwa}`);
  return g.zmienne.every((v) => env[v]?.trim());
}
