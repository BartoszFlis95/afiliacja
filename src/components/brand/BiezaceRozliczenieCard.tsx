import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { BiezaceRozliczenie } from "@/actions/invoice.actions";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const STATUSY: Record<BiezaceRozliczenie["status"], { tekst: string; klasa: string }> = {
  OCZEKUJE: {
    tekst: "Oczekuje na fakturę",
    klasa: "border-border text-muted-foreground",
  },
  WYSTAWIONA: {
    tekst: "Faktura wystawiona",
    klasa: "border-warning/30 bg-warning/10 text-warning",
  },
  OPLACONA: {
    tekst: "Opłacone",
    klasa: "border-success/30 bg-success/10 text-success",
  },
};

export function BiezaceRozliczenieCard({ dane }: { dane: BiezaceRozliczenie }) {
  const status = STATUSY[dane.status];

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Bieżące rozliczenie</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{dane.okres}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.klasa}`}
          >
            {status.tekst}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Sprzedaż</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCurrency(dane.sprzedaz)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {dane.status === "OCZEKUJE" ? "Prowizje" : "Prowizje (poza fakturą)"}
            </dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCurrency(dane.prowizje)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Opłata platformy</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCurrency(dane.oplata)}
            </dd>
          </div>
          <div>
            {/*
              Przed wystawieniem faktury to prognoza z narastających prowizji,
              nie należność — nazwanie tego „do zapłaty” sugerowałoby, że jest
              już co płacić.
            */}
            <dt className="text-xs text-muted-foreground">
              {dane.status === "OCZEKUJE" ? "Szacowana kwota brutto" : "Do zapłaty brutto"}
            </dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
              {formatCurrency(dane.doZaplaty)}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {dane.status === "OCZEKUJE"
            ? "Faktura zbiorcza zostanie wystawiona po zakończeniu miesiąca. Wypłaty influencerów odblokują się po jej opłaceniu."
            : dane.status === "WYSTAWIONA"
              ? "Faktura czeka na opłacenie. Po zaksięgowaniu wpłaty wypłaty influencerów zostaną odblokowane."
              : "Wpłata zaksięgowana — wypłaty influencerów za ten okres są odblokowane."}
        </p>

        <Link
          href="/brand/invoices"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {dane.invoiceNumber ? `Faktura ${dane.invoiceNumber}` : "Wszystkie faktury"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
