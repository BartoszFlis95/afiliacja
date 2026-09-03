"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppUrl, sendEmail } from "@/lib/resend";
import { ISSUER, issuerSkonfigurowany } from "@/lib/site";
import { formatEmailAmount, formatEmailDate } from "@/emails/utils";
import InvoiceEmail from "@/emails/InvoiceEmail";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { GenerateInvoiceSchema } from "@/lib/validations/invoice.schema";
import { executeStripeTransferAction } from "@/actions/stripe.actions";
import { InvoiceStatus, PayoutStatus } from "@prisma/client";
import type { InvoiceItem } from "@/types";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function generateInvoiceAction(
  formData: unknown
): Promise<ActionResult<{ id: string; invoiceNumber: string }>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Brak uprawnień administratora." };

  const parsed = GenerateInvoiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  const { brandId, periodFrom, periodTo, vatRate = 23, dueDate, notes } = parsed.data;

  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandId },
    include: { user: { select: { email: true } } },
  });

  if (!brand) return { success: false, error: "Nie znaleziono marki." };

  const from = new Date(periodFrom);
  const to = new Date(periodTo);
  to.setHours(23, 59, 59, 999);

  const conversions = await prisma.conversion.findMany({
    where: {
      affiliateLink: { product: { brandProfileId: brandId } },
      createdAt: { gte: from, lte: to },
      // PAID (influencer already wypłacony) jest tak samo rozliczalne wobec
      // marki jak CONFIRMED — inaczej opłacona konwersja nigdy nie trafia
      // na fakturę.
      status: { in: ["CONFIRMED", "PAID"] },
    },
    include: {
      affiliateLink: { include: { product: { select: { id: true, name: true } } } },
    },
  });

  if (conversions.length === 0) {
    return { success: false, error: "Brak rozliczonych konwersji w tym okresie." };
  }

  const productMap = new Map<string, { name: string; quantity: number; totalPlatformCommission: number }>();
  for (const conv of conversions) {
    const product = conv.affiliateLink.product;
    const existing = productMap.get(product.id);
    const amount = Number(conv.platformCommission);
    if (existing) {
      existing.quantity += 1;
      existing.totalPlatformCommission += amount;
    } else {
      productMap.set(product.id, {
        name: product.name,
        quantity: 1,
        totalPlatformCommission: amount,
      });
    }
  }

  const items: InvoiceItem[] = Array.from(productMap.values()).map((p) => ({
    description: `Prowizje afiliacyjne – ${p.name}`,
    quantity: p.quantity,
    unitPrice: p.quantity > 0 ? Math.round((p.totalPlatformCommission / p.quantity) * 100) / 100 : 0,
    totalPrice: Math.round(p.totalPlatformCommission * 100) / 100,
  }));

  const netAmount = items.reduce((s, i) => s + i.totalPrice, 0);
  const vatAmount = Math.round(netAmount * vatRate) / 100;
  const grossAmount = Math.round((netAmount + vatAmount) * 100) / 100;

  /**
   * Bez danych wystawcy faktura byłaby nieważna (fikcyjny NIP). Lepiej nie
   * wystawić jej wcale i powiedzieć adminowi czego brakuje, niż wystawić
   * dokument, który księgowa marki odrzuci — a numer faktury zostanie zużyty.
   */
  /**
   * Faktura VAT wystawiona firmie musi zawierać NIP nabywcy (art. 106e ust. 1
   * pkt 5 ustawy o VAT). Wcześniej te dane w ogóle nie istniały w systemie —
   * BrandProfile miał tylko companyName — więc każda faktura wychodziła bez
   * NIP-u nabywcy i marka nie mogła odliczyć z niej podatku.
   *
   * Odmawiamy zamiast wystawiać wadliwy dokument: numer faktury jest zasobem
   * jednorazowym i sekwencyjnym, więc zużycie go na dokument do korekty jest
   * gorsze niż jasny komunikat dla admina.
   */
  if (!brand.nip) {
    return {
      success: false,
      error:
        `Marka ${brand.companyName} nie ma uzupełnionego NIP-u. ` +
        "Faktura VAT bez NIP-u nabywcy jest nieważna — poproś markę " +
        "o uzupełnienie danych w ustawieniach profilu.",
    };
  }

  if (!issuerSkonfigurowany()) {
    return {
      success: false,
      error:
        "Brak danych wystawcy. Ustaw zmienne DENEEU_ISSUER_NAME, _NIP, " +
        "_ADDRESS, _CITY i _POSTAL_CODE przed wystawianiem faktur.",
    };
  }

  const invoiceNumber = await generateInvoiceNumber();

  const dueDateValue = dueDate
    ? new Date(dueDate)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      brandId,
      periodFrom: from,
      periodTo: to,
      netAmount,
      vatRate,
      vatAmount,
      grossAmount,
      brandCompanyName: brand.companyName,
      brandEmail: brand.user.email,
      // Migawka danych nabywcy — faktura nie może się zmienić, gdy marka
      // później zaktualizuje profil.
      brandNip: brand.nip,
      brandAddress: brand.address,
      brandCity: brand.city,
      brandPostalCode: brand.postalCode,
      issuerName: ISSUER.name,
      issuerNip: ISSUER.nip,
      issuerAddress: ISSUER.address,
      issuerCity: ISSUER.city,
      issuerPostalCode: ISSUER.postalCode,
      status: InvoiceStatus.ISSUED,
      issuedAt: new Date(),
      dueDate: dueDateValue,
      items: items as object,
      notes: notes ?? null,
    },
  });

  revalidatePath("/admin/invoices");
  revalidatePath("/admin/dashboard");

  if (invoice.brandEmail) {
    after(() =>
      sendEmail({
        to: invoice.brandEmail,
        subject: `📄 Faktura ${invoice.invoiceNumber} — ${formatEmailAmount(Number(invoice.grossAmount))}`,
        react: InvoiceEmail({
          brandName: invoice.brandCompanyName,
          invoiceNumber: invoice.invoiceNumber,
          grossAmount: Number(invoice.grossAmount),
          dueDate: formatEmailDate(invoice.dueDate),
          periodFrom: formatEmailDate(invoice.periodFrom),
          periodTo: formatEmailDate(invoice.periodTo),
          invoiceUrl: `${getAppUrl()}/api/invoices/${invoice.id}/pdf`,
          bankAccount: process.env.DENEEU_BANK_ACCOUNT ?? "—",
        }),
      }).catch((err) => console.error("[email] invoice failed:", err))
    );
  }

  return { success: true, data: { id: invoice.id, invoiceNumber: invoice.invoiceNumber } };
}

export async function previewInvoiceAction(data: {
  brandId: string;
  periodFrom: string;
  periodTo: string;
  vatRate?: number;
}): Promise<
  ActionResult<{
    items: InvoiceItem[];
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
    brandCompanyName: string;
  }>
> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Brak uprawnień." };

  const brand = await prisma.brandProfile.findUnique({
    where: { id: data.brandId },
    select: { companyName: true },
  });
  if (!brand) return { success: false, error: "Nie znaleziono marki." };

  const vatRate = data.vatRate ?? 23;
  const from = new Date(data.periodFrom);
  const to = new Date(data.periodTo);
  to.setHours(23, 59, 59, 999);

  const conversions = await prisma.conversion.findMany({
    where: {
      affiliateLink: { product: { brandProfileId: data.brandId } },
      createdAt: { gte: from, lte: to },
      // PAID (influencer already wypłacony) jest tak samo rozliczalne wobec
      // marki jak CONFIRMED — inaczej opłacona konwersja nigdy nie trafia
      // na fakturę.
      status: { in: ["CONFIRMED", "PAID"] },
    },
    include: {
      affiliateLink: { include: { product: { select: { id: true, name: true } } } },
    },
  });

  if (conversions.length === 0) {
    return { success: false, error: "Brak rozliczonych konwersji w tym okresie." };
  }

  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  for (const conv of conversions) {
    const product = conv.affiliateLink.product;
    const existing = productMap.get(product.id);
    const amount = Number(conv.platformCommission);
    if (existing) {
      existing.quantity += 1;
      existing.total += amount;
    } else {
      productMap.set(product.id, { name: product.name, quantity: 1, total: amount });
    }
  }

  const items: InvoiceItem[] = Array.from(productMap.values()).map((p) => ({
    description: `Prowizje afiliacyjne – ${p.name}`,
    quantity: p.quantity,
    unitPrice: p.quantity > 0 ? Math.round((p.total / p.quantity) * 100) / 100 : 0,
    totalPrice: Math.round(p.total * 100) / 100,
  }));

  const netAmount = items.reduce((s, i) => s + i.totalPrice, 0);
  const vatAmount = Math.round(netAmount * vatRate) / 100;
  const grossAmount = Math.round((netAmount + vatAmount) * 100) / 100;

  return {
    success: true,
    data: { items, netAmount, vatAmount, grossAmount, brandCompanyName: brand.companyName },
  };
}

export async function getInvoicesAction(filters?: {
  brandId?: string;
  status?: InvoiceStatus;
  year?: number;
}) {
  const session = await requireAdmin();
  if (!session) return { success: false as const, error: "Brak uprawnień." };

  const where: Record<string, unknown> = {};
  if (filters?.brandId) where.brandId = filters.brandId;
  if (filters?.status) where.status = filters.status;
  if (filters?.year) {
    where.issuedAt = {
      gte: new Date(`${filters.year}-01-01`),
      lte: new Date(`${filters.year}-12-31T23:59:59.999Z`),
    };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: { brand: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true as const,
    data: invoices.map((inv) => ({
      ...inv,
      netAmount: Number(inv.netAmount),
      vatRate: Number(inv.vatRate),
      vatAmount: Number(inv.vatAmount),
      grossAmount: Number(inv.grossAmount),
    })),
  };
}

export async function getInvoiceAction(invoiceId: string) {
  const session = await requireAdmin();
  if (!session) return { success: false as const, error: "Brak uprawnień." };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { brand: { select: { companyName: true, user: { select: { email: true } } } } },
  });

  if (!invoice) return { success: false as const, error: "Nie znaleziono faktury." };

  return {
    success: true as const,
    data: {
      ...invoice,
      netAmount: Number(invoice.netAmount),
      vatRate: Number(invoice.vatRate),
      vatAmount: Number(invoice.vatAmount),
      grossAmount: Number(invoice.grossAmount),
      items: invoice.items as unknown as InvoiceItem[],
    },
  };
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: InvoiceStatus
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Brak uprawnień." };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true, brandId: true, periodFrom: true, periodTo: true },
  });
  if (!invoice) return { success: false, error: "Nie znaleziono faktury." };

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      ...(status === InvoiceStatus.PAID ? { paidAt: new Date() } : {}),
    },
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoiceId}`);

  if (status === InvoiceStatus.PAID) {
    // Nie blokuj oznaczenia faktury jako opłaconej, jeśli wypłaty zawiodą —
    // każda próba transferu loguje własne błędy i nie rzuca wyjątku.
    await triggerPayoutsForInvoice(invoiceId, invoice.brandId, invoice.periodFrom, invoice.periodTo);
  }

  return { success: true };
}

/**
 * Po opłaceniu faktury przez markę zwalnia wypłaty influencerów, których
 * komisje mieszczą się w okresie i marce tej faktury. Konta ze skończonym
 * onboardingiem Stripe dostają automatyczny transfer; reszta zostaje w
 * statusie PROCESSING do ręcznego przelewu (executeStripeTransferAction
 * sam to rozróżnia i nigdy nie rzuca wyjątku).
 */
async function triggerPayoutsForInvoice(
  invoiceId: string,
  brandId: string,
  periodFrom: Date,
  periodTo: Date
): Promise<void> {
  const payouts = await prisma.payout.findMany({
    where: {
      status: PayoutStatus.PROCESSING,
      commission: {
        brandId,
        createdAt: { gte: periodFrom, lte: periodTo },
      },
    },
    select: { id: true },
  });

  for (const payout of payouts) {
    const result = await executeStripeTransferAction(payout.id);
    if (!result.success) {
      console.error(
        `[invoice] auto payout trigger left payout ${payout.id} for manual transfer:`,
        result.error
      );
    }
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { payoutsTriggered: true, paidViaStripe: payouts.length > 0 },
  });
}

export async function deleteInvoiceAction(invoiceId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Brak uprawnień." };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true },
  });
  if (!invoice) return { success: false, error: "Nie znaleziono faktury." };
  if (invoice.status !== InvoiceStatus.DRAFT) {
    return { success: false, error: "Można usunąć tylko faktury w statusie Szkic." };
  }

  await prisma.invoice.delete({ where: { id: invoiceId } });

  revalidatePath("/admin/invoices");
  return { success: true };
}

export async function getBrandsListAction() {
  const session = await requireAdmin();
  if (!session) return { success: false as const, error: "Brak uprawnień." };

  const brands = await prisma.brandProfile.findMany({
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });

  return { success: true as const, data: brands };
}
