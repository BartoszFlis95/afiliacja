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

interface AdminTransferFailedEmailProps {
  influencerName: string;
  amount: number;
  transferId: string;
}

export default function AdminTransferFailedEmail({
  influencerName,
  amount,
  transferId,
}: AdminTransferFailedEmailProps) {
  return (
    <EmailLayout preview="Transfer Stripe nie powiódł się">
      <EmailHeading>⚠️ Transfer Stripe nie powiódł się</EmailHeading>
      <EmailText>
        Transfer środków do influencera nie powiódł się i wymaga ręcznej weryfikacji.
        Wypłata została oznaczona jako odrzucona.
      </EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Influencer" value={influencerName} />
        <EmailInfoRow label="Kwota" value={formatEmailAmount(amount)} />
        <EmailInfoRow label="Stripe Transfer ID" value={transferId} />
      </EmailInfoBox>

      <EmailButtonLink href={`${getAppUrl()}/admin/payouts`}>
        Zobacz wypłaty
      </EmailButtonLink>
    </EmailLayout>
  );
}
