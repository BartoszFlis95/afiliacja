"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppUrl, sendEmail } from "@/lib/resend";
import { ISSUER, issuerSkonfigurowany, wystawcaZNiemiec } from "@/lib/site";
import { formatEmailAmount, formatEmailDate } from "@/emails/utils";
import InvoiceEmail from "@/emails/InvoiceEmail";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { executeStripeTransferAction } from "@/actions/stripe.actions";
import { InvoiceStatus, PayoutStatus } from "@prisma/client";
import type { InvoiceItem } from "@/types";
import { CommissionStatus } from "@prisma/client";
import {
  biezacyOkres,
  dataZDniem,
  granceMiesiaca,
  nazwaMiesiaca,
  okresZamkniety,
  pierwszyDzienPoOkresie,
  rozbicieFaktury,
  doGroszy,
} from "@/lib/rozliczenia";
import { OPLATA_PLATFORMY, TERMIN_PLATNOSCI_DNI } from "@/lib/legal";
import PayoutsUnlockedEmail from "@/emails/PayoutsUnlockedEmail";
import PaymentReminderEmail from "@/emails/PaymentReminderEmail";

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

/**
 * Faktura zbiorcza za miesiąc kalendarzowy.
 *
 * Jedyny generator faktur w systemie. Obejmuje PEŁNĄ kwotę należną
 * influencerom powiększoną o opłatę platformy — to ta wpłata finansuje
 * wypłaty, więc odblokowanie wypłat ma pokrycie w środkach.
 *
 * Wcześniej istniał drugi generator, fakturujący markę za samą prowizję
 * platformy. Oba pobierały numery z tej samej sekwencji, więc dawało się
 * wystawić dwa dokumenty o różnej podstawie za ten sam okres. Został usunięty.
 */
export async function generateMonthlyInvoiceAction(
  brandId: string,
  month: number,
  year: number
): Promise<ActionResult<{ id: string; invoiceNumber: string; grossAmount: number }>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Brak uprawnień administratora." };

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { success: false, error: "Nieprawidłowy miesiąc." };
  }
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return { success: false, error: "Nieprawidłowy rok." };
  }

  /**
   * Fakturujemy wyłącznie zamknięte miesiące.
   *
   * W trwającym okresie mogą jeszcze dojść zatwierdzone prowizje. Faktura
   * wystawiona w jego trakcie obejmowałaby część miesiąca, a reszta wymagałaby
   * drugiego dokumentu za ten sam okres — albo korekty. Numer faktury jest
   * zasobem sekwencyjnym, więc lepiej odmówić niż go zużyć.
   */
  if (!okresZamkniety(year, month)) {
    const nastepny = pierwszyDzienPoOkresie(year, month);
    return {
      success: false,
      error:
        `Nie można wystawić faktury za ${nazwaMiesiaca(month)} ${year} — ten okres jeszcze trwa. ` +
        `Faktura będzie dostępna ${dataZDniem(1, nastepny.miesiac, nastepny.rok)}.`,
    };
  }

  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandId },
    include: { user: { select: { email: true } } },
  });
  if (!brand) return { success: false, error: "Nie znaleziono marki." };

  /**
   * NIP nabywcy jest wymagany tylko przy wystawcy polskim.
   *
   * Art. 106e ust. 1 pkt 5 ustawy o VAT nakazuje podać NIP nabywcy na fakturze
   * wystawianej przez polskiego podatnika — bez niego dokument jest wadliwy
   * i nabywca nie odliczy podatku. Niemiecki Kleinunternehmer nie nalicza
   * podatku, więc nie ma czego odliczać, a numer nabywcy jest wtedy informacją
   * pomocniczą: jeśli marka go poda, trafia na fakturę, jeśli nie — sekcja
   * po prostu się nie pojawia.
   */
  if (!brand.nip && !wystawcaZNiemiec()) {
    return {
      success: false,
      error:
        `Marka ${brand.companyName} nie ma uzupełnionego NIP-u. Faktura VAT bez ` +
        "NIP-u nabywcy jest nieważna — poproś markę o uzupełnienie danych.",
    };
  }
  if (!issuerSkonfigurowany()) {
    return {
      success: false,
      error:
        "Brak danych wystawcy. Ustaw DENEEU_ISSUER_NAME, _TAX_ID, _ADDRESS, " +
        "_CITY, _POSTAL_CODE, _COUNTRY oraz numer rachunku przed wystawianiem faktur.",
    };
  }

  const { od, do: doDaty } = granceMiesiaca(year, month);

  /**
   * invoiceId: null jest tu kluczowe. Bez tego warunku ponowne wygenerowanie
   * faktury za ten sam miesiąc obciążyłoby markę drugi raz za te same
   * prowizje, a każda prowizja może należeć tylko do jednej faktury.
   */
  const prowizje = await prisma.commission.findMany({
    where: {
      brandId,
      status: CommissionStatus.APPROVED,
      invoiceId: null,
      createdAt: { gte: od, lte: doDaty },
    },
    select: {
      id: true,
      commissionAmount: true,
      product: { select: { id: true, name: true } },
    },
  });

  if (prowizje.length === 0) {
    return {
      success: false,
      error: `Brak zatwierdzonych, niezafakturowanych prowizji za ${nazwaMiesiaca(month)} ${year}.`,
    };
  }

  const sumaProwizji = prowizje.reduce((s, p) => s + Number(p.commissionAmount), 0);
  const { prowizje: kwotaProwizji, oplata, netto } = rozbicieFaktury(sumaProwizji);

  // pozycje: prowizje w rozbiciu na produkty + osobna linia opłaty platformy,
  // żeby marka widziała, za co dokładnie płaci
  const wgProduktu = new Map<string, { name: string; sztuk: number; kwota: number }>();
  for (const p of prowizje) {
    const biezace = wgProduktu.get(p.product.id);
    if (biezace) {
      biezace.sztuk += 1;
      biezace.kwota += Number(p.commissionAmount);
    } else {
      wgProduktu.set(p.product.id, {
        name: p.product.name,
        sztuk: 1,
        kwota: Number(p.commissionAmount),
      });
    }
  }

  const items: InvoiceItem[] = Array.from(wgProduktu.values()).map((p) => ({
    description: `Prowizje influencerów – ${p.name}`,
    quantity: p.sztuk,
    unitPrice: p.sztuk > 0 ? doGroszy(p.kwota / p.sztuk) : 0,
    totalPrice: doGroszy(p.kwota),
  }));

  items.push({
    description: `Opłata platformy Deneeu (${Math.round(OPLATA_PLATFORMY * 100)}% od prowizji)`,
    quantity: 1,
    unitPrice: oplata,
    totalPrice: oplata,
  });

  /**
   * Stawka VAT zależy od statusu wystawcy.
   *
   * Niemiecki mały przedsiębiorca (Kleinunternehmer, § 19 UStG) nie nalicza
   * podatku, więc kwota brutto równa się netto. Przy stawce zerowej vatAmount
   * wychodzi 0 samo z siebie — nie ma osobnej gałęzi, którą trzeba by
   * utrzymywać równolegle do zwykłej.
   */
  const vatRate = ISSUER.vatFree ? 0 : 23;
  const vatAmount = doGroszy((netto * vatRate) / 100);
  const grossAmount = doGroszy(netto + vatAmount);

  const invoiceNumber = await generateInvoiceNumber();
  const dueDate = new Date(Date.now() + TERMIN_PLATNOSCI_DNI * 24 * 60 * 60 * 1000);

  // Faktura i przypisanie prowizji w jednej transakcji: faktura bez
  // przypiętych prowizji byłaby dokumentem, którego opłacenie niczego nie
  // odblokowuje, a prowizje bez faktury dałoby się zafakturować ponownie.
  const invoice = await prisma.$transaction(async (tx) => {
    const utworzona = await tx.invoice.create({
      data: {
        invoiceNumber,
        brandId,
        periodFrom: od,
        periodTo: doDaty,
        netAmount: netto,
        vatRate,
        vatAmount,
        grossAmount,
        brandCompanyName: brand.companyName,
        brandEmail: brand.user.email,
        brandNip: brand.nip,
        brandAddress: brand.address,
        brandCity: brand.city,
        brandPostalCode: brand.postalCode,
        issuerName: ISSUER.name,
        issuerNip: ISSUER.taxId,
        issuerAddress: ISSUER.address,
        issuerCity: ISSUER.city,
        issuerPostalCode: ISSUER.postalCode,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
        dueDate,
        items: items as object,
        notes: `Rozliczenie za ${nazwaMiesiaca(month)} ${year}. Prowizje: ${kwotaProwizji.toFixed(2)} PLN, opłata platformy: ${oplata.toFixed(2)} PLN.`,
      },
    });

    await tx.commission.updateMany({
      where: { id: { in: prowizje.map((p) => p.id) } },
      data: { invoiceId: utworzona.id },
    });

    return utworzona;
  });

  revalidatePath("/admin/billing");
  revalidatePath("/admin/invoices");
  revalidatePath("/brand/invoices");

  if (invoice.brandEmail) {
    after(() =>
      sendEmail({
        to: invoice.brandEmail,
        subject: `Faktura ${invoice.invoiceNumber} za ${nazwaMiesiaca(month)} ${year} — ${formatEmailAmount(grossAmount)}`,
        react: InvoiceEmail({
          brandName: invoice.brandCompanyName,
          invoiceNumber: invoice.invoiceNumber,
          grossAmount,
          dueDate: formatEmailDate(invoice.dueDate),
          periodFrom: formatEmailDate(invoice.periodFrom),
          periodTo: formatEmailDate(invoice.periodTo),
          invoiceUrl: `${getAppUrl()}/api/invoices/${invoice.id}/pdf`,
          bankAccount: process.env.DENEEU_BANK_ACCOUNT ?? "—",
          // z faktury, nie ze zmiennej: mail i PDF muszą podawać tego samego
          // odbiorcę przelewu, a faktura trzyma migawkę z chwili wystawienia
          issuerName: invoice.issuerName,
        }),
      }).catch((err) => console.error("[email] monthly invoice failed:", err))
    );
  }

  return {
    success: true,
    data: { id: invoice.id, invoiceNumber: invoice.invoiceNumber, grossAmount },
  };
}

/**
 * Zaksięgowanie wpłaty marki: oznacza fakturę jako opłaconą i odblokowuje
 * wypłaty influencerów objętych tą fakturą.
 */
export async function markInvoicePaidAction(invoiceId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Brak uprawnień administratora." };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true, payoutsTriggered: true, periodFrom: true, periodTo: true },
  });
  if (!invoice) return { success: false, error: "Nie znaleziono faktury." };

  if (invoice.status === InvoiceStatus.PAID && invoice.payoutsTriggered) {
    return { success: false, error: "Ta faktura jest już oznaczona jako opłacona." };
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    return { success: false, error: "Nie można opłacić anulowanej faktury." };
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
      payoutsTriggered: true,
    },
  });

  await odblokujWyplatyFaktury(invoiceId);

  revalidatePath("/admin/billing");
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/payouts");
  revalidatePath("/brand/invoices");

  return { success: true };
}

/**
 * Odblokowanie wypłat po zaksięgowaniu wpłaty marki.
 *
 * Dopasowanie idzie po jawnym powiązaniu prowizji z fakturą, a nie po marce
 * i zakresie dat: okresy potrafią się nachodzić, a prowizja dopisana po
 * zamknięciu miesiąca trafia na fakturę następną — dopasowanie po dacie
 * odblokowałoby wtedy wypłatę, która nie została jeszcze opłacona.
 *
 * Nie rzuca wyjątkiem: nieudany transfer nie może cofnąć zaksięgowania
 * wpłaty, bo pieniądze marki już wpłynęły.
 */
async function odblokujWyplatyFaktury(invoiceId: string): Promise<void> {
  const prowizje = await prisma.commission.findMany({
    where: { invoiceId },
    select: {
      id: true,
      commissionAmount: true,
      influencerId: true,
      influencer: { select: { displayName: true, user: { select: { email: true } } } },
      payout: { select: { id: true, status: true } },
    },
  });

  if (prowizje.length === 0) return;

  // PENDING -> PROCESSING tylko dla wypłat, o które influencer już wnioskował.
  // Brak wypłaty znaczy, że jeszcze nie wnioskował — wtedy nie ma czego
  // odblokowywać. Wypłata zlecona już PO zaksięgowaniu wpłaty powstaje od razu
  // w PROCESSING (patrz requestPayoutAction), więc obie kolejności zdarzeń
  // kończą się tym samym stanem.
  const doOdblokowania = prowizje
    .filter((p) => p.payout && p.payout.status === PayoutStatus.PENDING)
    .map((p) => p.payout!.id);

  if (doOdblokowania.length > 0) {
    await prisma.payout.updateMany({
      where: { id: { in: doOdblokowania } },
      data: { status: PayoutStatus.PROCESSING, invoiceId },
    });

    for (const payoutId of doOdblokowania) {
      const wynik = await executeStripeTransferAction(payoutId);
      if (!wynik.success) {
        console.error(
          `[rozliczenia] wypłata ${payoutId} zostaje do ręcznego przelewu:`,
          wynik.error
        );
      }
    }
  }

  // Powiadomienie trafia do KAŻDEGO influencera objętego fakturą, także tego,
  // który jeszcze nie wnioskował o wypłatę — dla niego to właśnie sygnał, że
  // może to zrobić.
  const wgInfluencera = new Map<string, { email: string; nazwa: string; kwota: number }>();
  for (const p of prowizje) {
    const email = p.influencer.user.email;
    if (!email) continue;
    const biezace = wgInfluencera.get(p.influencerId);
    if (biezace) {
      biezace.kwota += Number(p.commissionAmount);
    } else {
      wgInfluencera.set(p.influencerId, {
        email,
        nazwa: p.influencer.displayName,
        kwota: Number(p.commissionAmount),
      });
    }
  }

  const okres = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { periodFrom: true },
  });
  const nazwaOkresu = okres
    ? `${nazwaMiesiaca(okres.periodFrom.getMonth() + 1)} ${okres.periodFrom.getFullYear()}`
    : "bieżący okres";

  for (const [, dane] of wgInfluencera) {
    after(() =>
      sendEmail({
        to: dane.email,
        subject: `Wypłaty odblokowane — ${formatEmailAmount(doGroszy(dane.kwota))} za ${nazwaOkresu}`,
        react: PayoutsUnlockedEmail({
          influencerName: dane.nazwa,
          period: nazwaOkresu,
          amount: doGroszy(dane.kwota),
          payoutUrl: `${getAppUrl()}/influencer/commissions`,
        }),
      }).catch((err) => console.error("[email] payouts unlocked failed:", err))
    );
  }
}

/** Ile pełnych dni minęło od podanej daty; ujemne, gdy jest w przyszłości. */
function dniOd(data: Date): number {
  return Math.floor((Date.now() - data.getTime()) / 86_400_000);
}

/** Jedna faktura wystawiona w okresie. */
export type WierszFaktury = {
  id: string;
  invoiceNumber: string;
  brandId: string;
  companyName: string;
  status: InvoiceStatus;
  netAmount: number;
  grossAmount: number;
  /** Rozbicie odtworzone z kwoty netto — prowizje bez opłaty platformy. */
  prowizje: number;
  oplata: number;
  payoutsTriggered: boolean;
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  periodFrom: string;
  periodTo: string;
  dniPoTerminie: number;
  odblokowaneWyplaty: number;
  kwotaWyplat: number;
};

/**
 * Marka × miesiąc z prowizjami czekającymi na fakturę.
 *
 * Wiersz na PARĘ marka–miesiąc, a nie na markę: prowizje z różnych miesięcy
 * trafiają na osobne faktury, więc zlewanie ich w jeden wiersz sugerowałoby
 * jeden dokument tam, gdzie powstaną dwa.
 */
export type WierszDoZafakturowania = {
  brandId: string;
  companyName: string;
  nip: string | null;
  rok: number;
  miesiac: number;
  /** Nazwa okresu do wyświetlenia, np. „sierpień 2026”. */
  okres: string;
  /** Czy miesiąc się zakończył — tylko wtedy wolno wystawić fakturę. */
  zamkniety: boolean;
  /** Kiedy faktura będzie dostępna; wypełnione tylko dla okresów otwartych. */
  dostepnaOd: string | null;
  liczbaProwizji: number;
  prowizje: number;
  oplata: number;
  netto: number;
  brutto: number;
};

export type ZestawienieRozliczen = {
  faktury: WierszFaktury[];
  doZafakturowania: WierszDoZafakturowania[];
};

/**
 * Zestawienie miesięczne dla panelu administratora.
 *
 * Wiersz na FAKTURĘ, nie na markę. Wcześniej zestawienie było budowane po
 * markach — jeden wiersz z najnowszą fakturą okresu — przez co druga faktura
 * tej samej marki (możliwa, gdy po wystawieniu pierwszej doszły kolejne
 * zatwierdzone prowizje) nie pojawiała się nigdzie. Zakładki „oczekujące /
 * opłacone” obiecywały kompletną listę, której model danych nie dostarczał.
 *
 * Marki z prowizjami jeszcze niezafakturowanymi trafiają do osobnej sekcji —
 * to nie są faktury, więc nie mogą udawać wierszy w tej samej tabeli.
 */
export async function getBillingOverviewAction(
  month: number,
  year: number
): Promise<ActionResult<ZestawienieRozliczen>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Brak uprawnień administratora." };

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { success: false, error: "Nieprawidłowy miesiąc." };
  }
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return { success: false, error: "Nieprawidłowy rok." };
  }

  const { od, do: doDaty } = granceMiesiaca(year, month);

  const [marki, prowizje, faktury] = await Promise.all([
    prisma.brandProfile.findMany({
      select: { id: true, companyName: true, nip: true },
      orderBy: { companyName: "asc" },
    }),
    /**
     * Prowizje do zafakturowania z WSZYSTKICH okresów, nie tylko z wybranego
     * w filtrze. Admin ma widzieć wszystko, co czeka na fakturę, bez
     * przeklikiwania miesięcy — inaczej zaległy okres łatwo przeoczyć.
     */
    prisma.commission.findMany({
      where: { status: CommissionStatus.APPROVED, invoiceId: null },
      select: { brandId: true, commissionAmount: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: { periodFrom: { gte: od }, periodTo: { lte: doDaty } },
      select: {
        id: true,
        brandId: true,
        brandCompanyName: true,
        invoiceNumber: true,
        status: true,
        netAmount: true,
        grossAmount: true,
        payoutsTriggered: true,
        issuedAt: true,
        dueDate: true,
        paidAt: true,
        periodFrom: true,
        periodTo: true,
        // jednym zapytaniem dla wszystkich faktur, bez N+1 na wiersz
        payouts: { select: { amount: true } },
      },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  const wierszeFaktur: WierszFaktury[] = faktury.map((f) => {
    const netto = Number(f.netAmount);
    // netto = prowizje + prowizje * OPLATA_PLATFORMY, więc prowizje = netto / (1 + stawka)
    const kwotaProwizji = doGroszy(netto / (1 + OPLATA_PLATFORMY));
    return {
      id: f.id,
      invoiceNumber: f.invoiceNumber,
      brandId: f.brandId,
      companyName: f.brandCompanyName,
      status: f.status,
      netAmount: netto,
      grossAmount: Number(f.grossAmount),
      prowizje: kwotaProwizji,
      oplata: doGroszy(netto - kwotaProwizji),
      payoutsTriggered: f.payoutsTriggered,
      issuedAt: f.issuedAt.toISOString(),
      dueDate: f.dueDate.toISOString(),
      paidAt: f.paidAt?.toISOString() ?? null,
      periodFrom: f.periodFrom.toISOString(),
      periodTo: f.periodTo.toISOString(),
      dniPoTerminie: dniOd(f.dueDate),
      odblokowaneWyplaty: f.payouts.length,
      kwotaWyplat: doGroszy(f.payouts.reduce((s, p) => s + Number(p.amount), 0)),
    };
  });

  /**
   * Grupowanie po parze marka–miesiąc. Miesiąc bierzemy ze strefy warszawskiej,
   * tej samej, w której liczone są granice okresu — inaczej prowizja z przełomu
   * trafiłaby do innego kubełka niż na fakturę.
   */
  const markaPoId = new Map(marki.map((m) => [m.id, m]));
  const sumy = new Map<string, { suma: number; liczba: number; rok: number; miesiac: number }>();

  for (const p of prowizje) {
    const { rok, miesiac } = biezacyOkres(p.createdAt);
    const klucz = `${p.brandId}|${rok}-${miesiac}`;
    const biezace = sumy.get(klucz) ?? { suma: 0, liczba: 0, rok, miesiac };
    biezace.suma += Number(p.commissionAmount);
    biezace.liczba += 1;
    sumy.set(klucz, biezace);
  }

  const doZafakturowania: WierszDoZafakturowania[] = [...sumy.entries()]
    .map(([klucz, agregat]) => {
      const brandId = klucz.split("|")[0];
      const marka = markaPoId.get(brandId);
      const { prowizje: kwota, oplata, netto } = rozbicieFaktury(agregat.suma);
      const zamkniety = okresZamkniety(agregat.rok, agregat.miesiac);
      const nastepny = pierwszyDzienPoOkresie(agregat.rok, agregat.miesiac);
      return {
        brandId,
        companyName: marka?.companyName ?? "—",
        nip: marka?.nip ?? null,
        rok: agregat.rok,
        miesiac: agregat.miesiac,
        okres: `${nazwaMiesiaca(agregat.miesiac)} ${agregat.rok}`,
        zamkniety,
        dostepnaOd: zamkniety ? null : dataZDniem(1, nastepny.miesiac, nastepny.rok),
        liczbaProwizji: agregat.liczba,
        prowizje: kwota,
        oplata,
        netto,
        brutto: doGroszy(netto * 1.23),
      };
    })
    // najstarsze okresy pierwsze — te są najpilniejsze
    .sort(
      (a, b) =>
        a.rok * 12 + a.miesiac - (b.rok * 12 + b.miesiac) ||
        a.companyName.localeCompare(b.companyName, "pl"),
    );

  return { success: true, data: { faktury: wierszeFaktur, doZafakturowania } };
}

export type BiezaceRozliczenie = {
  okres: string;
  sprzedaz: number;
  prowizje: number;
  oplata: number;
  doZaplaty: number;
  status: "OCZEKUJE" | "WYSTAWIONA" | "OPLACONA";
  invoiceId: string | null;
  invoiceNumber: string | null;
};

/**
 * Podsumowanie bieżącego okresu dla panelu marki.
 *
 * Pokazuje miesiąc trwający — marka widzi, ile narasta jej zobowiązanie,
 * zanim dostanie fakturę.
 */
export async function getBrandBillingSummaryAction(): Promise<
  ActionResult<BiezaceRozliczenie>
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    return { success: false, error: "Brak uprawnień." };
  }

  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brand) return { success: false, error: "Brak profilu marki." };

  const teraz = new Date();
  const miesiac = teraz.getMonth() + 1;
  const rok = teraz.getFullYear();
  const { od, do: doDaty } = granceMiesiaca(rok, miesiac);

  const [prowizje, faktura] = await Promise.all([
    prisma.commission.findMany({
      where: {
        brandId: brand.id,
        status: { in: [CommissionStatus.APPROVED, CommissionStatus.PAID] },
        createdAt: { gte: od, lte: doDaty },
      },
      select: { commissionAmount: true, orderValue: true, invoiceId: true },
    }),
    prisma.invoice.findFirst({
      where: { brandId: brand.id, periodFrom: { gte: od }, periodTo: { lte: doDaty } },
      select: { id: true, invoiceNumber: true, status: true, grossAmount: true },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  // Sprzedaż to całość obrotu w miesiącu — informacja, nie zobowiązanie.
  const sprzedaz = doGroszy(prowizje.reduce((s, p) => s + Number(p.orderValue), 0));

  /**
   * Kwota do zapłaty liczona TYLKO z prowizji jeszcze niezafakturowanych —
   * dokładnie tym samym warunkiem co generateMonthlyInvoiceAction. Wcześniej
   * karta sumowała wszystkie prowizje miesiąca, więc po wystawieniu faktury
   * marka widziała pełną kwotę jako wciąż do zapłaty, a po jej opłaceniu
   * status mówił „Opłacone” obok niezerowej należności.
   */
  const niezafakturowane = prowizje.filter((p) => p.invoiceId === null);
  const suma = niezafakturowane.reduce((s, p) => s + Number(p.commissionAmount), 0);
  const { prowizje: kwota, oplata, netto } = rozbicieFaktury(suma);

  const status: BiezaceRozliczenie["status"] = !faktura
    ? "OCZEKUJE"
    : faktura.status === InvoiceStatus.PAID
      ? "OPLACONA"
      : "WYSTAWIONA";

  return {
    success: true,
    data: {
      okres: `${nazwaMiesiaca(miesiac)} ${rok}`,
      sprzedaz,
      prowizje: kwota,
      oplata,
      // faktura wystawiona -> wiążąca jest jej kwota; przed wystawieniem
      // pokazujemy prognozę z narastających prowizji
      doZaplaty: faktura ? Number(faktura.grossAmount) : doGroszy(netto * 1.23),
      status,
      invoiceId: faktura?.id ?? null,
      invoiceNumber: faktura?.invoiceNumber ?? null,
    },
  };
}

/** Faktury zalogowanej marki, najnowsze pierwsze. */
export async function getMyBrandInvoicesAction(): Promise<
  ActionResult<
    {
      id: string;
      invoiceNumber: string;
      periodFrom: string;
      periodTo: string;
      grossAmount: number;
      status: InvoiceStatus;
      dueDate: string;
      paidAt: string | null;
      /** Do baneru z danymi przelewu — musi zgadzać się z fakturą PDF. */
      brandCompanyName: string;
      issuerName: string;
      /** Liczone tutaj, nie w renderze: Date.now() w komponencie jest nieczyste. */
      dniPoTerminie: number;
    }[]
  >
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    return { success: false, error: "Brak uprawnień." };
  }

  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brand) return { success: false, error: "Brak profilu marki." };

  const faktury = await prisma.invoice.findMany({
    where: { brandId: brand.id },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      periodFrom: true,
      periodTo: true,
      grossAmount: true,
      status: true,
      dueDate: true,
      paidAt: true,
      brandCompanyName: true,
      issuerName: true,
    },
  });

  return {
    success: true,
    data: faktury.map((f) => ({
      id: f.id,
      invoiceNumber: f.invoiceNumber,
      periodFrom: f.periodFrom.toISOString(),
      periodTo: f.periodTo.toISOString(),
      grossAmount: Number(f.grossAmount),
      status: f.status,
      dueDate: f.dueDate.toISOString(),
      paidAt: f.paidAt?.toISOString() ?? null,
      brandCompanyName: f.brandCompanyName,
      issuerName: f.issuerName,
      dniPoTerminie: dniOd(f.dueDate),
    })),
  };
}

/**
 * Przypomnienie o nieopłaconej fakturze — wysyłane do ADMINA.
 *
 * W procesie ręcznym platforma nie wie, czy przelew wpłynął; wie to tylko
 * osoba patrząca na konto bankowe. Mail ma skłonić ją do sprawdzenia, a nie
 * ponaglić markę — ta mogła już zapłacić, a wpłata czeka na zaksięgowanie.
 */
export async function sendPaymentReminderAction(
  invoiceId: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Brak uprawnień administratora." };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      invoiceNumber: true,
      brandCompanyName: true,
      grossAmount: true,
      issuedAt: true,
      dueDate: true,
      status: true,
      payoutsTriggered: true,
    },
  });
  if (!invoice) return { success: false, error: "Nie znaleziono faktury." };

  if (invoice.status === InvoiceStatus.PAID || invoice.payoutsTriggered) {
    return { success: false, error: "Ta faktura jest już opłacona." };
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    return { success: false, error: "Faktura została anulowana." };
  }

  const adres = session.user?.email;
  if (!adres) return { success: false, error: "Konto administratora nie ma adresu e-mail." };

  await sendEmail({
    to: adres,
    subject: `Nieopłacona faktura ${invoice.invoiceNumber} — ${formatEmailAmount(Number(invoice.grossAmount))}`,
    react: PaymentReminderEmail({
      brandName: invoice.brandCompanyName,
      invoiceNumber: invoice.invoiceNumber,
      grossAmount: Number(invoice.grossAmount),
      issuedAt: formatEmailDate(invoice.issuedAt),
      dueDate: formatEmailDate(invoice.dueDate),
      dniPoTerminie: dniOd(invoice.dueDate),
      billingUrl: `${getAppUrl()}/admin/billing`,
    }),
  });

  return { success: true };
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
    select: { status: true, payoutsTriggered: true },
  });
  if (!invoice) return { success: false, error: "Nie znaleziono faktury." };

  // Odblokowanie wysyła maile do influencerów, więc musi zajść dokładnie raz.
  // Bez tego ponowne ustawienie statusu PAID rozsyłałoby duplikaty.
  const juzOdblokowane = invoice.payoutsTriggered;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      ...(status === InvoiceStatus.PAID
        ? { paidAt: new Date(), payoutsTriggered: true }
        : {}),
    },
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/billing");

  if (status === InvoiceStatus.PAID && !juzOdblokowane) {
    // Nie blokuj oznaczenia faktury jako opłaconej, jeśli wypłaty zawiodą —
    // każda próba transferu loguje własne błędy i nie rzuca wyjątku.
    // Ta sama ścieżka co markInvoicePaidAction — inaczej oznaczenie faktury
    // jako opłaconej dawałoby inny skutek zależnie od tego, z którego ekranu
    // admin je kliknął: bez maili i bez podniesienia wypłat z PENDING.
    await odblokujWyplatyFaktury(invoiceId);
  }

  return { success: true };
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

