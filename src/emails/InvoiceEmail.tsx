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

interface InvoiceEmailProps {
  brandName: string;
  invoiceNumber: string;
  grossAmount: number;
  dueDate: string;
  periodFrom: string;
  periodTo: string;
  invoiceUrl: string;
  bankAccount: string;
}

export default function InvoiceEmail({
  brandName,
  invoiceNumber,
  grossAmount,
  dueDate,
  periodFrom,
  periodTo,
  invoiceUrl,
  bankAccount,
}: InvoiceEmailProps) {
  return (
    <EmailLayout preview={`Faktura ${invoiceNumber} — ${formatEmailAmount(grossAmount)}`}>
      <EmailHeading>
        📄 Faktura {invoiceNumber} — {formatEmailAmount(grossAmount)}
      </EmailHeading>
      <EmailText>Cześć {brandName},</EmailText>
      <EmailText>Nowa faktura od Deneeu.</EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Nr faktury" value={invoiceNumber} />
        <EmailInfoRow label="Kwota brutto" value={formatEmailAmount(grossAmount)} />
        <EmailInfoRow label="Termin płatności" value={dueDate} />
        <EmailInfoRow label="Okres" value={`${periodFrom} - ${periodTo}`} />
      </EmailInfoBox>

      <EmailText>Dane do przelewu:</EmailText>
      <EmailInfoBox>
        <EmailInfoRow label="Odbiorca" value="Deneeu Sp. z o.o." />
        <EmailInfoRow label="Nr konta" value={bankAccount} />
        <EmailInfoRow label="Tytuł" value={invoiceNumber} />
      </EmailInfoBox>

      <EmailButtonLink href={invoiceUrl}>Pobierz fakturę PDF</EmailButtonLink>
    </EmailLayout>
  );
}
