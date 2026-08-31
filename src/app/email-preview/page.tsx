import { notFound } from "next/navigation";
import { render } from "@react-email/render";

import WelcomeEmail from "@/emails/WelcomeEmail";
import VerifyEmailEmail from "@/emails/VerifyEmailEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import NewCommissionEmail from "@/emails/NewCommissionEmail";
import CommissionApprovedEmail from "@/emails/CommissionApprovedEmail";
import CommissionPendingBrandEmail from "@/emails/CommissionPendingBrandEmail";
import PayoutApprovedEmail from "@/emails/PayoutApprovedEmail";
import PayoutCompletedEmail from "@/emails/PayoutCompletedEmail";
import InvoiceEmail from "@/emails/InvoiceEmail";

export const dynamic = "force-dynamic";

const templates: { name: string; subject: string; element: React.ReactElement }[] = [
  {
    name: "VerifyEmailEmail",
    subject: "Potwierdź swój email w Deneeu",
    element: VerifyEmailEmail({
      name: "Kasia",
      verifyUrl: "https://deneeu.pl/verify-email?token=example-token",
    }),
  },
  {
    name: "PasswordResetEmail",
    subject: "Zresetuj hasło w Deneeu",
    element: PasswordResetEmail({
      name: "Kasia",
      resetUrl: "https://deneeu.pl/reset-password?token=example-token",
    }),
  },
  {
    name: "WelcomeEmail (BRAND)",
    subject: "Witaj w Deneeu! 🎉",
    element: WelcomeEmail({ name: "Kasia", role: "BRAND" }),
  },
  {
    name: "WelcomeEmail (INFLUENCER)",
    subject: "Witaj w Deneeu! 🎉",
    element: WelcomeEmail({ name: "Kasia", role: "INFLUENCER" }),
  },
  {
    name: "NewCommissionEmail",
    subject: "🎉 Nowa prowizja! +45,00 zł",
    element: NewCommissionEmail({
      influencerName: "Kasia",
      productName: "Krem nawilżający 50ml",
      brandName: "Beauty Sp. z o.o.",
      orderValue: 300,
      commissionAmount: 45,
      commissionPercent: 15,
    }),
  },
  {
    name: "CommissionApprovedEmail",
    subject: "✅ Prowizja zatwierdzona! Możesz wypłacić 45,00 zł",
    element: CommissionApprovedEmail({
      influencerName: "Kasia",
      productName: "Krem nawilżający 50ml",
      commissionAmount: 45,
      availableBalance: 320,
    }),
  },
  {
    name: "CommissionPendingBrandEmail",
    subject: "📋 Nowa prowizja do zatwierdzenia",
    element: CommissionPendingBrandEmail({
      brandName: "Beauty Sp. z o.o.",
      influencerName: "Kasia",
      productName: "Krem nawilżający 50ml",
      orderValue: 300,
      commissionAmount: 45,
      orderId: "ORD-10293",
    }),
  },
  {
    name: "PayoutApprovedEmail (bank)",
    subject: "💸 Wypłata zatwierdzona — 320,00 zł w drodze",
    element: PayoutApprovedEmail({
      influencerName: "Kasia",
      amount: 320,
      bankAccount: "PL61109010140000071219812874",
      preferredPayout: "BANK",
    }),
  },
  {
    name: "PayoutCompletedEmail",
    subject: "✅ Wypłata zrealizowana — 320,00 zł wysłane!",
    element: PayoutCompletedEmail({
      influencerName: "Kasia",
      amount: 320,
      referenceNumber: "cljref12345",
    }),
  },
  {
    name: "InvoiceEmail",
    subject: "📄 Faktura FV/2026/003 — 1 234,56 zł",
    element: InvoiceEmail({
      brandName: "Beauty Sp. z o.o.",
      invoiceNumber: "FV/2026/003",
      grossAmount: 1234.56,
      dueDate: "19.07.2026",
      periodFrom: "01.06.2026",
      periodTo: "30.06.2026",
      invoiceUrl: "https://deneeu.pl/api/invoices/example/pdf",
      bankAccount: "PL00 0000 0000 0000 0000 0000 0000",
    }),
  },
];

export default async function EmailPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const rendered = await Promise.all(
    templates.map(async (t) => ({ ...t, html: await render(t.element) }))
  );

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Podgląd szablonów emaili</h1>
      <p className="text-sm text-slate-500 mb-8">
        Dostępne tylko w trybie development. {rendered.length} szablonów.
      </p>

      <div className="flex flex-col gap-10 max-w-2xl">
        {rendered.map((t) => (
          <div key={t.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-900 text-white">
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-xs text-slate-300">Temat: {t.subject}</p>
            </div>
            <iframe
              title={t.name}
              srcDoc={t.html}
              className="w-full"
              style={{ height: 640, border: "none" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
