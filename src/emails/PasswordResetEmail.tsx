import * as React from "react";
import {
  EmailButtonLink,
  EmailHeading,
  EmailLayout,
  EmailText,
} from "@/emails/components/EmailLayout";

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export default function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Zresetuj hasło do swojego konta w Deneeu">
      <EmailHeading>Reset hasła 🔒</EmailHeading>
      <EmailText>Witaj {name}!</EmailText>
      <EmailText>
        Kliknij poniższy przycisk, aby zresetować hasło. Link wygasa za 1 godzinę.
      </EmailText>

      <EmailButtonLink href={resetUrl}>Resetuj hasło</EmailButtonLink>

      <EmailText>
        Jeśli nie prosiłeś/aś o reset hasła, po prostu zignoruj tę wiadomość — Twoje
        hasło pozostanie bez zmian.
      </EmailText>
    </EmailLayout>
  );
}
