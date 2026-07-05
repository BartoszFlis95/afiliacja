import { Resend } from "resend";
import type * as React from "react";

// Resend rzuca wyjątek już w konstruktorze, jeśli brak klucza — a moduł jest
// importowany podczas builda (zbieranie danych stron), więc brak klucza w
// środowisku (np. lokalnie przed skonfigurowaniem Resend) nie może wywalać builda.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_key");

export const FROM_EMAIL = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`;

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://deneeu.pl";
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
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
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
