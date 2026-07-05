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

interface CommissionPendingBrandEmailProps {
  brandName: string;
  influencerName: string;
  productName: string;
  orderValue: number;
  commissionAmount: number;
  orderId?: string;
}

export default function CommissionPendingBrandEmail({
  brandName,
  influencerName,
  productName,
  orderValue,
  commissionAmount,
  orderId,
}: CommissionPendingBrandEmailProps) {
  return (
    <EmailLayout preview="Nowa prowizja do zatwierdzenia">
      <EmailHeading>📋 Nowa prowizja do zatwierdzenia</EmailHeading>
      <EmailText>Cześć {brandName},</EmailText>
      <EmailText>Nowa konwersja wymaga Twojej akceptacji.</EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Influencer" value={influencerName} />
        <EmailInfoRow label="Produkt" value={productName} />
        <EmailInfoRow label="Wartość zamówienia" value={formatEmailAmount(orderValue)} />
        <EmailInfoRow label="Kwota prowizji" value={formatEmailAmount(commissionAmount)} />
        {orderId && <EmailInfoRow label="Nr zamówienia" value={orderId} />}
      </EmailInfoBox>

      <EmailButtonLink href={`${getAppUrl()}/brand/commissions`}>
        Zatwierdź prowizję
      </EmailButtonLink>
    </EmailLayout>
  );
}
