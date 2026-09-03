import * as React from "react";
import { formatEmailAmount } from "@/emails/utils";
import {
  EmailButtonLink,
  EmailHeading,
  EmailInfoBox,
  EmailInfoRow,
  EmailLayout,
  EmailText,
} from "@/emails/components/EmailLayout";

interface PayoutsUnlockedEmailProps {
  influencerName: string;
  /** Nazwa okresu rozliczeniowego, np. „sierpień 2026”. */
  period: string;
  amount: number;
  payoutUrl: string;
}

export default function PayoutsUnlockedEmail({
  influencerName,
  period,
  amount,
  payoutUrl,
}: PayoutsUnlockedEmailProps) {
  return (
    <EmailLayout
      preview={`Wypłaty odblokowane — ${formatEmailAmount(amount)} za ${period}`}
    >
      <EmailHeading>
        🔓 Wypłaty odblokowane — {formatEmailAmount(amount)}
      </EmailHeading>

      <EmailText>Cześć {influencerName},</EmailText>

      <EmailText>
        Marka opłaciła fakturę za {period}, więc Twoje prowizje z tego okresu są
        już gotowe do wypłaty.
      </EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Okres rozliczeniowy" value={period} />
        <EmailInfoRow label="Kwota do wypłaty" value={formatEmailAmount(amount)} />
      </EmailInfoBox>

      <EmailText>
        Jeśli wniosek o wypłatę został już złożony, jest właśnie realizowany i
        nie musisz robić nic więcej. Jeśli jeszcze go nie złożono, możesz to
        zrobić teraz.
      </EmailText>

      <EmailButtonLink href={payoutUrl}>Przejdź do wypłat</EmailButtonLink>
    </EmailLayout>
  );
}
