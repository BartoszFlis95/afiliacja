import * as React from "react";
import { getAppUrl } from "@/lib/resend";
import {
  EmailButtonLink,
  EmailHeading,
  EmailLayout,
  EmailListItem,
  EmailText,
} from "@/emails/components/EmailLayout";

interface WelcomeEmailProps {
  name: string;
  role: "BRAND" | "INFLUENCER";
}

export default function WelcomeEmail({ name, role }: WelcomeEmailProps) {
  const isBrand = role === "BRAND";
  const dashboardUrl = `${getAppUrl()}${isBrand ? "/brand/dashboard" : "/influencer/dashboard"}`;

  return (
    <EmailLayout preview="Witaj w Deneeu! Twoje konto jest gotowe.">
      <EmailHeading>Witaj w Deneeu! 🎉</EmailHeading>
      <EmailText>Witaj {name}!</EmailText>
      <EmailText>
        {isBrand
          ? "Twoje konto marki jest gotowe."
          : "Twoje konto influencera jest gotowe."}
      </EmailText>

      <EmailText>Kolejne kroki:</EmailText>
      {isBrand ? (
        <>
          <EmailListItem>✓ Uzupełnij profil firmy</EmailListItem>
          <EmailListItem>✓ Dodaj pierwszy produkt</EmailListItem>
          <EmailListItem>✓ Skonfiguruj webhook do śledzenia sprzedaży</EmailListItem>
        </>
      ) : (
        <>
          <EmailListItem>✓ Uzupełnij profil</EmailListItem>
          <EmailListItem>✓ Dodaj dane bankowe</EmailListItem>
          <EmailListItem>✓ Wygeneruj pierwszy link afiliacyjny</EmailListItem>
        </>
      )}

      <EmailButtonLink href={dashboardUrl}>Przejdź do panelu</EmailButtonLink>
    </EmailLayout>
  );
}
