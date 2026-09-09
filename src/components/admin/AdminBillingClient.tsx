"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, BellRing, Clock, FileText, Receipt } from "lucide-react";
import { toast } from "sonner";

import {
  generateMonthlyInvoiceAction,
  markInvoicePaidAction,
  sendPaymentReminderAction,
  type WierszDoZafakturowania,
  type WierszFaktury,
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
import { biezacyOkres, dataZDniem, nazwaMiesiaca, pierwszyDzienPoOkresie } from "@/lib/rozliczenia";
import { TERMIN_PLATNOSCI_DNI } from "@/lib/legal";

const MIESIACE = Array.from({ length: 12 }, (_, i) => i + 1);

type Zakladka = "oczekujace" | "oplacone" | "wszystkie";

const ZAKLADKI: { id: Zakladka; label: string }[] = [
  { id: "oczekujace", label: "Oczekujące" },
  { id: "oplacone", label: "Opłacone" },
  { id: "wszystkie", label: "Wszystkie" },
];

function StatusFaktury({ f }: { f: WierszFaktury }) {
  if (f.status === "PAID") {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        Opłacona — wypłaty odblokowane
      </span>
    );
  }
  if (f.status === "CANCELLED") {
    return (
      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Anulowana
      </span>
    );
  }
  // Po terminie to inna sytuacja niż „czeka”: wymaga działania, nie cierpliwości.
  if (f.dniPoTerminie > 0) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
        <AlertTriangle className="h-3 w-3" />
        {f.dniPoTerminie} {f.dniPoTerminie === 1 ? "dzień" : "dni"} po terminie
      </span>
    );
  }
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
      Czeka na wpłatę
    </span>
  );
}

export function AdminBillingClient({
  faktury,
  doZafakturowania,
  month,
  year,
  numerKonta,
}: {
  faktury: WierszFaktury[];
  doZafakturowania: WierszDoZafakturowania[];
  month: number;
  year: number;
  numerKonta: string;
}) {
  const router = useRouter();
  const [pracuje, setPracuje] = useState<string | null>(null);
  const [zakladka, setZakladka] = useState<Zakladka>("oczekujace");
  const [, startTransition] = useTransition();

  const lata = [year - 1, year, year + 1];

  // komunikat przy pustej liście: kiedy pojawi się faktura za trwający miesiąc
  const teraz = biezacyOkres();
  const biezacyOkresNazwa = `${nazwaMiesiaca(teraz.miesiac)} ${teraz.rok}`;
  const poBiezacym = pierwszyDzienPoOkresie(teraz.rok, teraz.miesiac);
  const dostepnaOdBiezacego = dataZDniem(1, poBiezacym.miesiac, poBiezacym.rok);

  const pasuje = (f: WierszFaktury, id: Zakladka) =>
    id === "wszystkie" ? true : id === "oplacone" ? f.status === "PAID" : f.status !== "PAID";

  const widoczne = faktury.filter((f) => pasuje(f, zakladka));
  const licznik = (id: Zakladka) => faktury.filter((f) => pasuje(f, id)).length;

  function zmienOkres(m: number, r: number) {
    router.push(`/admin/billing?month=${m}&year=${r}`);
  }

  function zrob(
    klucz: string,
    akcja: () => Promise<{ success: boolean; error?: string }>,
    komunikat: string,
  ) {
    setPracuje(klucz);
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
        Instrukcja i numer konta na górze, bo w procesie ręcznym admin jest
        brakującym ogniwem: system nie wie o wpłacie, dopóki ktoś jej nie
        potwierdzi. Kolory z tokenów motywu — stałe wartości dałyby jasne
        panele na ciemnym tle.
      */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Jak działa rozliczenie</h2>
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

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="miesiac" className="text-sm text-muted-foreground">Okres</label>
        <select
          id="miesiac"
          value={month}
          onChange={(e) => zmienOkres(Number(e.target.value), year)}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground"
        >
          {MIESIACE.map((m) => <option key={m} value={m}>{nazwaMiesiaca(m)}</option>)}
        </select>
        <select
          aria-label="Rok"
          value={year}
          onChange={(e) => zmienOkres(month, Number(e.target.value))}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground"
        >
          {lata.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* ---------- Do zafakturowania ---------- */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Do zafakturowania</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Zatwierdzone prowizje bez przypisanej faktury, ze wszystkich okresów —
            nie tylko z wybranego wyżej.
          </p>
        </div>

        {doZafakturowania.length === 0 ? (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-foreground">Brak prowizji do zafakturowania.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Faktura za {biezacyOkresNazwa} będzie dostępna {dostepnaOdBiezacego} —
                miesiąc musi się najpierw zakończyć.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doZafakturowania.map((m) => {
              const klucz = `${m.brandId}-${m.rok}-${m.miesiac}`;
              const zajety = pracuje === klucz;
              // trzy różne przyczyny blokady, każda z własnym komunikatem —
              // „przycisk nieaktywny” bez powodu zmusza admina do zgadywania
              const powod = !m.zamkniety
                ? `Okres jeszcze trwa. Faktura będzie dostępna ${m.dostepnaOd}.`
                : !m.nip
                  ? `Marka ${m.companyName} nie ma NIP-u — faktura VAT bez NIP-u nabywcy jest nieważna.`
                  : null;

              return (
                <Card key={klucz} className={m.zamkniety ? undefined : "border-dashed"}>
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div>
                      <p className="font-medium text-foreground">{m.companyName}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {m.okres} · {m.liczbaProwizji}{" "}
                        {m.liczbaProwizji === 1 ? "prowizja" : "prowizji"} ·{" "}
                        <span className="font-medium tabular-nums text-foreground">
                          {formatCurrency(m.prowizje)}
                        </span>
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-muted/50 p-3 text-xs">
                      <dt className="text-muted-foreground">Opłata platformy</dt>
                      <dd className="text-right tabular-nums text-foreground">
                        {formatCurrency(m.oplata)}
                      </dd>
                      <dt className="text-muted-foreground">Razem brutto</dt>
                      <dd className="text-right font-semibold tabular-nums text-foreground">
                        {formatCurrency(m.brutto)}
                      </dd>
                    </dl>

                    <div className="mt-auto space-y-2">
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={powod !== null || zajety}
                        loading={zajety}
                        title={powod ?? undefined}
                        onClick={() =>
                          zrob(
                            klucz,
                            () => generateMonthlyInvoiceAction(m.brandId, m.miesiac, m.rok),
                            `Faktura za ${m.okres} wystawiona i wysłana do marki`,
                          )
                        }
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Generuj fakturę za {nazwaMiesiaca(m.miesiac)}
                      </Button>

                      {powod && (
                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Clock className="mt-0.5 h-3 w-3 shrink-0" />
                          {powod}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- Faktury ---------- */}
      <section className="space-y-3">
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
            title="Brak faktur"
            description={`Za ${nazwaMiesiaca(month)} ${year} nie ma faktur w tym stanie.`}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faktura</TableHead>
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
                    {widoczne.map((f) => {
                      const zajety = pracuje === f.id;
                      return (
                        <TableRow key={f.id}>
                          <TableCell>
                            <Link
                              href={`/admin/invoices/${f.id}`}
                              className="block font-mono text-xs font-medium text-primary hover:underline"
                            >
                              {f.invoiceNumber}
                            </Link>
                            <span className="mt-0.5 block text-sm text-foreground">
                              {f.companyName}
                            </span>
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatDate(new Date(f.periodFrom))} – {formatDate(new Date(f.periodTo))}
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(f.prowizje)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(f.oplata)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums text-foreground">
                            {formatCurrency(f.grossAmount)}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            <span className="block">wyst. {formatDate(new Date(f.issuedAt))}</span>
                            <span className="block">termin {formatDate(new Date(f.dueDate))}</span>
                            {f.paidAt && (
                              <span className="block text-success">
                                wpłata {formatDate(new Date(f.paidAt))}
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <StatusFaktury f={f} />
                            {f.status === "PAID" && f.odblokowaneWyplaty > 0 && (
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {f.odblokowaneWyplaty}{" "}
                                {f.odblokowaneWyplaty === 1 ? "wypłata" : "wypłat"} ·{" "}
                                {formatCurrency(f.kwotaWyplat)}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            {f.status === "PAID" ? (
                              <span className="text-xs text-success">Wypłaty odblokowane ✓</span>
                            ) : f.status === "CANCELLED" ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-wrap justify-end gap-2">
                                {/*
                                  Przypomnienie dopiero po terminie — wcześniej
                                  marka ma prawo jeszcze nie zapłacić, a przycisk
                                  sugerowałby zaległość.
                                */}
                                {f.dniPoTerminie > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={zajety}
                                    onClick={() =>
                                      zrob(
                                        f.id,
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
                                      f.id,
                                      () => markInvoicePaidAction(f.id),
                                      "Wpłata zaksięgowana — wypłaty odblokowane",
                                    )
                                  }
                                  className="bg-success text-white hover:bg-success/90"
                                >
                                  Oznacz jako zapłacone
                                </Button>
                              </div>
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
      </section>
    </div>
  );
}
