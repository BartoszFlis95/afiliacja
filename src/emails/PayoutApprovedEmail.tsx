import * as React from "react";
import { getAppUrl } from "@/lib/resend";
import { formatEmailAmount, maskIban } from "@/emails/utils";
import {
  EmailButtonLink,
  EmailHeading,
  EmailInfoBox,
  EmailInfoRow,
  EmailLayout,
  EmailText,
} from "@/emails/components/EmailLayout";

interface PayoutApprovedEmailProps {
  influencerName: string;
  amount: number;
  bankAccount?: string;
  paypalEmail?: string;
  preferredPayout?: string;
}

export default function PayoutApprovedEmail({
  influencerName,
  amount,
  bankAccount,
  paypalEmail,
  preferredPayout,
}: PayoutApprovedEmailProps) {
  const usesPaypal = preferredPayout === "PAYPAL" && paypalEmail;

  return (
    <EmailLayout preview={`Wypłata zatwierdzona — ${formatEmailAmount(amount)} w drodze`}>
      <EmailHeading>💸 Wypłata zatwierdzona — {formatEmailAmount(amount)} w drodze</EmailHeading>
      <EmailText>Cześć {influencerName},</EmailText>
      <EmailText>Twój wniosek o wypłatę został zatwierdzony.</EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Kwota" value={formatEmailAmount(amount)} />
        <EmailInfoRow
          label="Metoda"
          value={usesPaypal ? `PayPal: ${paypalEmail}` : `Przelew bankowy (IBAN: ${maskIban(bankAccount)})`}
        />
        <EmailInfoRow label="Oczekiwany czas" value="1-3 dni robocze" />
      </EmailInfoBox>

      <EmailButtonLink href={`${getAppUrl()}/influencer/commissions`}>
        Zobacz szczegóły
      </EmailButtonLink>
    </EmailLayout>
  );
}
