import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Baner z danymi do przelewu dla nieopłaconej faktury.
 *
 * Te same wartości co na fakturze PDF i w mailu — zwłaszcza tytuł przelewu,
 * który skleja numer faktury z nazwą marki. Trzy różne tytuły dla jednego
 * przelewu sprawiłyby, że wpłaty nie da się dopasować przy ręcznym księgowaniu.
 */
export function DaneDoPrzelewu({
  invoiceNumber,
  brandCompanyName,
  issuerName,
  grossAmount,
  dueDate,
  numerKonta,
  poTerminie,
}: {
  invoiceNumber: string;
  brandCompanyName: string;
  issuerName: string;
  grossAmount: number;
  dueDate: string;
  numerKonta: string;
  poTerminie: boolean;
}) {
  const tytul = `Faktura ${invoiceNumber} / ${brandCompanyName}`;

  return (
    <Card className={poTerminie ? "border-destructive/40" : "border-warning/40"}>
      <CardContent className="p-5">
        <p
          className={`text-sm font-semibold ${poTerminie ? "text-destructive" : "text-warning"}`}
        >
          {poTerminie
            ? "Termin płatności minął"
            : "Faktura oczekuje na płatność"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Wykonaj przelew na poniższe dane, aby odblokować wypłaty dla swoich
          influencerów. Do czasu zaksięgowania wpłaty ich prowizje pozostają
          zablokowane.
        </p>

        <dl className="mt-4 space-y-3 rounded-lg border border-border bg-muted/40 p-4">
          <div>
            <dt className="text-xs text-muted-foreground">Odbiorca</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">{issuerName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Numer konta</dt>
            <dd className="mt-0.5 break-all font-mono text-sm font-bold tabular-nums text-foreground">
              {numerKonta}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tytuł przelewu</dt>
            <dd className="mt-0.5 text-sm font-bold text-foreground">{tytul}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Kwota</dt>
            <dd
              className={`mt-0.5 text-xl font-bold tabular-nums ${poTerminie ? "text-destructive" : "text-warning"}`}
            >
              {formatCurrency(grossAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Termin płatności</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">
              {formatDate(new Date(dueDate))}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Prosimy o wpisanie podanego tytułu przelewu — po nim rozpoznajemy
          wpłatę i odblokowujemy wypłaty.
        </p>
      </CardContent>
    </Card>
  );
}
