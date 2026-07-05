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

interface PayoutCompletedEmailProps {
  influencerName: string;
  amount: number;
  referenceNumber?: string;
}

export default function PayoutCompletedEmail({
  influencerName,
  amount,
  referenceNumber,
}: PayoutCompletedEmailProps) {
  return (
    <EmailLayout preview={`Wypłata zrealizowana — ${formatEmailAmount(amount)} wysłane!`}>
      <EmailHeading>✅ Wypłata zrealizowana — {formatEmailAmount(amount)} wysłane!</EmailHeading>
      <EmailText>Cześć {influencerName},</EmailText>
      <EmailText>Twoja wypłata została zrealizowana.</EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Kwota" value={formatEmailAmount(amount)} />
        {referenceNumber && <EmailInfoRow label="Numer referencyjny" value={referenceNumber} />}
      </EmailInfoBox>

      <EmailText>Pieniądze powinny pojawić się na koncie w ciągu 1-2 dni.</EmailText>

      <EmailButtonLink href={`${getAppUrl()}/influencer/commissions`}>
        Historia wypłat
      </EmailButtonLink>
    </EmailLayout>
  );
}
