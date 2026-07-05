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

interface NewCommissionEmailProps {
  influencerName: string;
  productName: string;
  brandName: string;
  orderValue: number;
  commissionAmount: number;
  commissionPercent: number;
}

export default function NewCommissionEmail({
  influencerName,
  productName,
  brandName,
  orderValue,
  commissionAmount,
  commissionPercent,
}: NewCommissionEmailProps) {
  return (
    <EmailLayout preview={`Nowa prowizja! +${formatEmailAmount(commissionAmount)}`}>
      <EmailHeading>🎉 Nowa prowizja! +{formatEmailAmount(commissionAmount)}</EmailHeading>
      <EmailText>Cześć {influencerName},</EmailText>
      <EmailText>Gratulacje! Ktoś kupił przez Twój link!</EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Produkt" value={productName} />
        <EmailInfoRow label="Marka" value={brandName} />
        <EmailInfoRow label="Wartość zamówienia" value={formatEmailAmount(orderValue)} />
        <EmailInfoRow
          label={`Twoja prowizja (${commissionPercent}%)`}
          value={formatEmailAmount(commissionAmount)}
        />
        <EmailInfoRow label="Status" value="Oczekuje na zatwierdzenie przez markę" />
      </EmailInfoBox>

      <EmailButtonLink href={`${getAppUrl()}/influencer/commissions`}>
        Zobacz prowizje
      </EmailButtonLink>
    </EmailLayout>
  );
}
