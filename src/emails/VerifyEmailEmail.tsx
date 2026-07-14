import * as React from "react";
import {
  EmailHeading,
  EmailLayout,
  EmailText,
} from "@/emails/components/EmailLayout";

interface VerifyEmailEmailProps {
  name: string;
  verifyUrl: string;
}

export default function VerifyEmailEmail({ name, verifyUrl }: VerifyEmailEmailProps) {
  return (
    <EmailLayout preview="Potwierdź swój email, aby aktywować konto w Deneeu">
      <EmailHeading>Potwierdź swój email ✉️</EmailHeading>
      <EmailText>Witaj {name}!</EmailText>
      <EmailText>
        Kliknij przycisk poniżej, aby potwierdzić swój adres email i aktywować konto w Deneeu.
      </EmailText>
      <EmailText>Link jest ważny przez 24 godziny.</EmailText>

      <a
        href={verifyUrl}
        style={{
          display: "inline-block",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          padding: "12px 24px",
          borderRadius: 8,
          margin: "8px 0 16px",
        }}
      >
        Potwierdź email
      </a>

      <EmailText>
        Jeśli to nie Ty zakładałeś/aś to konto, po prostu zignoruj tę wiadomość.
      </EmailText>
    </EmailLayout>
  );
}
