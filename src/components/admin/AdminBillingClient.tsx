"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, BellRing, FileText, Receipt } from "lucide-react";
import { toast } from "sonner";

import {
  generateMonthlyInvoiceAction,
  markInvoicePaidAction,
  sendPaymentReminderAction,
  type PozycjaRozliczenia,
} from "@/actions/invoice.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { nazwaMiesiaca } from "@/lib/rozliczenia";
import { TERMIN_PLATNOSCI_DNI } from "@/lib/legal";

const MIESIACE = Array.from({ length: 12 }, (_, i) => i + 1);

type Zakladka = "oczekujace" | "oplacone" | "wszystkie";

const ZAKLADKI: { id: Zakladka; label: string }[] = [
  { id: "oczekujace", label: "Oczekujące" },
  { id: "oplacone", label: "Opłacone" },
  { id: "wszystkie", label: "Wszystkie" },
];

function Status({ pozycja }: { pozycja: PozycjaRozliczenia }) {
  const f = pozycja.invoice;

  if (!f) {
    return (
      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Do zafakturowania
      </span>
    );
  }

  if (f.status === "PAID") {
    return (
      <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        Opłacona — wypłaty odblokowane
      </span>
    );
  }

  // Po terminie to inna sytuacja niż „czeka”: wymaga działania, nie cierpliwości.
  if (f.dniPoTerminie > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
        <AlertTriangle className="h-3 w-3" />
        {f.dniPoTerminie} {f.dniPoTerminie === 1 ? "dzień" : "dni"} po terminie
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
      Czeka na wpłatę
    </span>
  );
}

export function AdminBillingClient({
  pozycje,
  month,
  year,
  numerKonta,
}: {
  pozycje: PozycjaRozliczenia[];
  month: number;
  year: number;
  numerKonta: string;
}) {
  const router = useRouter();
  const [pracuje, setPracuje] = useState<string | null>(null);
  const [zakladka, setZakladka] = useState<Zakladka>("oczekujace");
  const [, startTransition] = useTransition();

  const lata = [year - 1, year, year + 1];

  const widoczne = pozycje.filter((p) => {
    if (zakladka === "wszystkie") return true;
    const oplacona = p.invoice?.status === "PAID";
    return zakladka === "oplacone" ? oplacona : !oplacona;
  });

  const licznik = (id: Zakladka) =>
    pozycje.filter((p) => {
      if (id === "wszystkie") return true;
      const oplacona = p.invoice?.status === "PAID";
      return id === "oplacone" ? oplacona : !oplacona;
    }).length;

  function zmienOkres(m: number, r: number) {
    router.push(`/admin/billing?month=${m}&year=${r}`);
  }

  function zrob(
    pozycja: PozycjaRozliczenia,
    akcja: () => Promise<{ success: boolean; error?: string }>,
    komunikat: string,
  ) {
    setPracuje(pozycja.brandId);
    startTransition(async () => {
      const wynik = await akcja();
      setPracuje(null);
      if (!wynik.success) {
        toast.error(wynik.error ?? "Nie udało się wykonać operacji.");
        return;
      }
      toast.success(komunikat);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/*
        Instrukcja i numer konta na górze, bo w procesie ręcznym to admin jest
        brakującym ogniwem: system nie wie o wpłacie, dopóki ktoś jej nie
        potwierdzi. Kolory z tokenów motywu, nie bg-blue-50 — stałe wartości
        dałyby jasny panel na ciemnym tle.
      */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Jak działa rozliczenie
            </h2>
            <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li>1. Wygeneruj fakturę za zamknięty miesiąc.</li>
              <li>2. System wysyła ją mailem do marki wraz z danymi do przelewu.</li>
              <li>3. Marka przelewa kwotę na konto Deneeu.</li>
              <li>4. Sprawdź konto — gdy wpłata wpłynie, kliknij „Oznacz jako zapłacone”.</li>
              <li>5. Wypłaty influencerów z tego okresu odblokują się automatycznie.</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="lg:w-72">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-foreground">Konto do przelewów</p>
            <p className="mt-1.5 break-all font-mono text-base font-bold tabular-nums text-foreground">
              {numerKonta}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Marka wpisuje numer faktury w tytule przelewu — po nim rozpoznasz
              wpłatę. Termin: {TERMIN_PLATNOSCI_DNI} dni od wystawienia.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Okres */}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="miesiac" className="text-sm text-muted-foreground">
          Okres
        </label>
        <select
          id="miesiac"
          value={month}
          onChange={(e) => zmienOkres(Number(e.target.value), year)}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground"
        >
          {MIESIACE.map((m) => (
            <option key={m} value={m}>{nazwaMiesiaca(m)}</option>
          ))}
        </select>
        <select
          aria-label="Rok"
          value={year}
          onChange={(e) => zmienOkres(month, Number(e.target.value))}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground"
        >
          {lata.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Zakładki */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtruj faktury po stanie">
        {ZAKLADKI.map((z) => (
          <Button
            key={z.id}
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setZakladka(z.id)}
            aria-pressed={zakladka === z.id}
            className={cn(
              "h-8 rounded-full px-3.5 text-xs font-medium hover:bg-muted",
              zakladka === z.id &&
                "bg-foreground text-background hover:bg-foreground hover:text-background",
            )}
          >
            {z.label} ({licznik(z.id)})
          </Button>
        ))}
      </div>

      {widoczne.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Brak pozycji"
          description={`Za ${nazwaMiesiaca(month)} ${year} nie ma tu nic do pokazania.`}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marka i faktura</TableHead>
                    <TableHead>Okres</TableHead>
                    <TableHead className="text-right">Prowizje</TableHead>
                    <TableHead className="text-right">Opłata</TableHead>
                    <TableHead className="text-right">Razem brutto</TableHead>
                    <TableHead>Daty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcja</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {widoczne.map((p) => {
                    const f = p.invoice;
                    const zajety = pracuje === p.brandId;

                    return (
                      <TableRow key={p.brandId}>
                        <TableCell>
                          <span className="font-medium text-foreground">{p.companyName}</span>
                          {!p.nip && (
                            <span className="mt-0.5 block text-xs text-destructive">
                              brak NIP — nie da się wystawić faktury
                            </span>
                          )}
                          {f && (
                            <Link
                              href={`/admin/invoices/${f.id}`}
                              className="mt-0.5 block font-mono text-xs text-primary hover:underline"
                            >
                              {f.invoiceNumber}
                            </Link>
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {f
                            ? `${formatDate(new Date(f.periodFrom))} – ${formatDate(new Date(f.periodTo))}`
                            : `${nazwaMiesiaca(month)} ${year}`}
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.prowizje)}
                          {p.liczbaProwizji > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({p.liczbaProwizji})
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatCurrency(p.oplata)}
                        </TableCell>

                        <TableCell className="text-right font-medium tabular-nums text-foreground">
                          {formatCurrency(f ? f.grossAmount : p.brutto)}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {f ? (
                            <>
                              <span className="block">
                                wyst. {formatDate(new Date(f.issuedAt))}
                              </span>
                              <span className="block">
                                termin {formatDate(new Date(f.dueDate))}
                              </span>
                              {f.paidAt && (
                                <span className="block text-success">
                                  wpłata {formatDate(new Date(f.paidAt))}
                                </span>
                              )}
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Status pozycja={p} />
                          {/* Dla opłaconych: co ta wpłata faktycznie uruchomiła. */}
                          {f?.status === "PAID" && f.odblokowaneWyplaty > 0 && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {f.odblokowaneWyplaty}{" "}
                              {f.odblokowaneWyplaty === 1 ? "wypłata" : "wypłat"} ·{" "}
                              {formatCurrency(f.kwotaWyplat)}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {!f ? (
                            <Button
                              size="sm"
                              disabled={!p.nip || p.liczbaProwizji === 0 || zajety}
                              loading={zajety}
                              onClick={() =>
                                zrob(
                                  p,
                                  () => generateMonthlyInvoiceAction(p.brandId, month, year),
                                  "Faktura wystawiona i wysłana do marki",
                                )
                              }
                            >
                              <FileText className="mr-1.5 h-3.5 w-3.5" />
                              Generuj fakturę
                            </Button>
                          ) : f.status !== "PAID" ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              {/*
                                Przypomnienie pokazujemy dopiero po terminie —
                                wcześniej marka ma prawo jeszcze nie zapłacić,
                                a przycisk sugerowałby zaległość.
                              */}
                              {f.dniPoTerminie > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={zajety}
                                  onClick={() =>
                                    zrob(
                                      p,
                                      () => sendPaymentReminderAction(f.id),
                                      "Przypomnienie wysłane na Twój adres",
                                    )
                                  }
                                  className="border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                                >
                                  <BellRing className="mr-1.5 h-3.5 w-3.5" />
                                  Przypomnij
                                </Button>
                              )}
                              <Button
                                size="sm"
                                disabled={zajety}
                                loading={zajety}
                                onClick={() =>
                                  zrob(
                                    p,
                                    () => markInvoicePaidAction(f.id),
                                    "Wpłata zaksięgowana — wypłaty odblokowane",
                                  )
                                }
                                className="bg-success text-white hover:bg-success/90"
                              >
                                Oznacz jako zapłacone
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-success">
                              Wypłaty odblokowane ✓
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
