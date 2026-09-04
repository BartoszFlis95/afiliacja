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

interface PaymentReminderEmailProps {
  brandName: string;
  invoiceNumber: string;
  grossAmount: number;
  issuedAt: string;
  dueDate: string;
  /** Ile dni po terminie; 0 lub mniej = jeszcze przed terminem. */
  dniPoTerminie: number;
  billingUrl: string;
}

/**
 * Przypomnienie dla ADMINA, nie dla marki.
 *
 * W procesie ręcznym platforma nie wie, czy przelew wpłynął — dowiaduje się
 * tego dopiero, gdy admin zajrzy na konto bankowe. Ten mail ma go do tego
 * skłonić, dlatego mówi „sprawdź konto”, a nie „zapłać”. Pomyłka w adresacie
 * skończyłaby się ponaglaniem marki, która mogła już zapłacić.
 */
export default function PaymentReminderEmail({
  brandName,
  invoiceNumber,
  grossAmount,
  issuedAt,
  dueDate,
  dniPoTerminie,
  billingUrl,
}: PaymentReminderEmailProps) {
  const poTerminie = dniPoTerminie > 0;

  return (
    <EmailLayout
      preview={`${invoiceNumber} — ${formatEmailAmount(grossAmount)} od ${brandName} nadal nieopłacona`}
    >
      <EmailHeading>
        {poTerminie ? "⚠️" : "⏳"} Faktura {invoiceNumber} nadal nieopłacona
      </EmailHeading>

      <EmailText>
        Faktura dla <strong>{brandName}</strong> nie została jeszcze oznaczona
        jako opłacona
        {poTerminie
          ? `, a termin płatności minął ${dniPoTerminie} ${odmianaDni(dniPoTerminie)} temu.`
          : "."}
      </EmailText>

      <EmailInfoBox>
        <EmailInfoRow label="Marka" value={brandName} />
        <EmailInfoRow label="Nr faktury" value={invoiceNumber} />
        <EmailInfoRow label="Kwota" value={<strong>{formatEmailAmount(grossAmount)}</strong>} />
        <EmailInfoRow label="Wystawiona" value={issuedAt} />
        <EmailInfoRow label="Termin płatności" value={<strong>{dueDate}</strong>} />
      </EmailInfoBox>

      <EmailText>
        Sprawdź konto bankowe. Jeśli wpłata wpłynęła, oznacz fakturę jako
        opłaconą — <strong>wypłaty influencerów z tego okresu odblokują się
        automatycznie</strong>.
      </EmailText>

      <EmailButtonLink href={billingUrl}>Przejdź do rozliczeń</EmailButtonLink>
    </EmailLayout>
  );
}

/** Po liczebniku innym niż 1 polski dopełniacz to zawsze „dni”. */
function odmianaDni(n: number): string {
  return n === 1 ? "dzień" : "dni";
}
