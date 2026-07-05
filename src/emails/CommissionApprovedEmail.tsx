import * as React from "react";
import { getAppUrl } from "@/lib/resend";
import { formatEmailAmount } from "@/emails/utils";
import {
  EmailButtonLink,
  EmailHeading,
  EmailInfoBox,
  EmailInfoRow,
  EmailLayout,
  EmailText,
} from "@/emails/components/EmailLayout";

interface CommissionApprovedEmailProps {
  influencerName: string;
  productName: string;
  commissionAmount: number;
  availableBalance: number;
}

export default function CommissionApprovedEmail({
  influencerName,
  productName,
  commissionAmount,
  availableBalance,
}: CommissionApprovedEmailProps) {
  return (
    <EmailLayout
      preview={`Prowizja zatwierdzona! Możesz wypłacić ${formatEmailAmount(commissionAmount)}`}
    >
      <EmailHeading>
        ✅ Prowizja zatwierdzona! Możesz wypłacić {formatEmailAmount(commissionAmount)}
      </EmailHeading>
      <EmailText>Cześć {influencerName},</EmailText>
      <EmailText>Twoja prowizja została zatwierdzona przez markę.</EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Produkt" value={productName} />
        <EmailInfoRow label="Kwota" value={formatEmailAmount(commissionAmount)} />
        <EmailInfoRow label="Dostępne do wypłaty" value={formatEmailAmount(availableBalance)} />
      </EmailInfoBox>

      <EmailText>
        Jeśli masz uzupełnione dane bankowe, możesz od razu złożyć wniosek o wypłatę.
      </EmailText>

      <EmailButtonLink href={`${getAppUrl()}/influencer/commissions`}>
        Wypłać teraz
      </EmailButtonLink>
    </EmailLayout>
  );
}
