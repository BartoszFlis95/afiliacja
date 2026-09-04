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
  /** Nazwa wystawcy z faktury — NIE zaszyta w szablonie, patrz niżej. */
  issuerName: string;
}

/**
 * Faktura zbiorcza za miesiąc — jedyny mail z fakturą w systemie.
 *
 * Dane do przelewu muszą być IDENTYCZNE z tymi na PDF-ie. Wcześniej odbiorca
 * był tu wpisany na sztywno jako „Deneeu Sp. z o.o.”, a tytuł przelewu to był
 * sam numer faktury — podczas gdy PDF podaje nazwę wystawcy z faktury i tytuł
 * z nazwą marki. Marka dostawała więc dwa różne polecenia dla jednego przelewu,
 * co przy ręcznym księgowaniu kończy się wpłatą, której nie da się dopasować.
 */
export default function InvoiceEmail({
  brandName,
  invoiceNumber,
  grossAmount,
  dueDate,
  periodFrom,
  periodTo,
  invoiceUrl,
  bankAccount,
  issuerName,
}: InvoiceEmailProps) {
  const tytulPrzelewu = `Faktura ${invoiceNumber} / ${brandName}`;

  return (
    <EmailLayout preview={`Faktura ${invoiceNumber} — ${formatEmailAmount(grossAmount)} do zapłaty`}>
      <EmailHeading>
        📄 Faktura {invoiceNumber} — {formatEmailAmount(grossAmount)}
      </EmailHeading>

      <EmailText>Cześć {brandName},</EmailText>

      <EmailText>
        Poniżej rozliczenie za okres {periodFrom} – {periodTo}. Kwota obejmuje
        prowizje Twoich influencerów wraz z opłatą platformy.
      </EmailText>

      <EmailText>
        <strong>Wypłaty influencerów zostaną odblokowane po zaksięgowaniu tej
        wpłaty</strong> — do tego czasu ich prowizje pozostają zablokowane.
      </EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Nr faktury" value={invoiceNumber} />
        <EmailInfoRow label="Okres rozliczeniowy" value={`${periodFrom} – ${periodTo}`} />
        <EmailInfoRow
          label="Do zapłaty"
          value={<strong>{formatEmailAmount(grossAmount)}</strong>}
        />
        <EmailInfoRow label="Termin płatności" value={<strong>{dueDate}</strong>} />
      </EmailInfoBox>

      <EmailText>
        <strong>Dane do przelewu</strong>
      </EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Odbiorca" value={issuerName} />
        <EmailInfoRow label="Numer konta" value={<strong>{bankAccount}</strong>} />
        <EmailInfoRow label="Tytuł przelewu" value={<strong>{tytulPrzelewu}</strong>} />
        <EmailInfoRow label="Kwota" value={<strong>{formatEmailAmount(grossAmount)}</strong>} />
      </EmailInfoBox>

      <EmailText>
        Prosimy o wpisanie podanego tytułu przelewu — po nim rozpoznajemy wpłatę
        i odblokowujemy wypłaty.
      </EmailText>

      <EmailButtonLink href={invoiceUrl}>Pobierz fakturę PDF</EmailButtonLink>
    </EmailLayout>
  );
}
