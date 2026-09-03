import { render } from "@react-email/render";
import { Resend } from "resend";
import type * as React from "react";

import { CANONICAL_URL } from "@/lib/site";

// Resend rzuca wyjątek już w konstruktorze, jeśli brak klucza — a moduł jest
// importowany podczas builda (zbieranie danych stron), więc brak klucza w
// środowisku (np. lokalnie przed skonfigurowaniem Resend) nie może wywalać builda.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_key");

/**
 * Nadawca. Bez wartości domyślnych `${undefined} <${undefined}>` dawało
 * dosłownie "undefined <undefined>" — nagłówek From odrzucany przez Resend,
 * więc każdy mail padał z komunikatem nieprowadzącym do przyczyny.
 * Klient Resend obok ma fallback na brak klucza; tutaj go nie było.
 */
const FROM_NAME = process.env.RESEND_FROM_NAME || "Deneeu";
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "kontakt@deneeu.pl";

export const FROM_EMAIL = `${FROM_NAME} <${FROM_ADDRESS}>`;

if (process.env.NODE_ENV === "production") {
  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn(
      "[resend] RESEND_FROM_EMAIL nie jest ustawiony — używam " + FROM_ADDRESS,
    );
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn(
      "[resend] NEXT_PUBLIC_APP_URL nie jest ustawiony — linki w mailach będą " +
        "wskazywać na " + CANONICAL_URL,
    );
  }
}

/**
 * Bazowy adres dla linków w mailach.
 *
 * Fallback to CANONICAL_URL (z www), nie apex. Wcześniej było tu
 * "https://deneeu.pl" — linki weryfikacji i resetu hasła niosą token w query
 * stringu, a przekierowanie apex -> www, które go nie zachowuje, zjadałoby
 * token po cichu.
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || CANONICAL_URL;
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  try {
    /**
     * Wersja tekstowa obok HTML-owej.
     *
     * Wysyłaliśmy wcześniej sam HTML. Wiadomość bez części text/plain to znany
     * sygnał dla filtrów antyspamowych, a niosą tu linki do resetu hasła
     * i weryfikacji konta — trafienie do spamu oznacza, że użytkownik nie
     * odzyska dostępu do konta i nie ma jak tego obejść.
     *
     * Tekst generujemy z TEGO SAMEGO elementu co HTML, więc obie wersje nie
     * mogą się rozjechać przy zmianie szablonu.
     */
    const text = await render(react, { plainText: true });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
      text,
    });
    if (error) {
      console.error("[resend] error:", error);
      return { success: false, error: error.message };
    }
    console.log("[resend] sent:", data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[resend] catch:", err);
    return { success: false, error: String(err) };
  }
}
