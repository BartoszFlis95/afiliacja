"use client";

import { useState } from "react";
import { Building2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BillingType = "individual" | "company";

interface BillingData {
  billingType?: BillingType;
}

interface Props {
  initialData?: BillingData;
}

const BILLING_OPTIONS: {
  value: BillingType;
  label: string;
  sub: string;
  icon: React.ElementType;
}[] = [
  {
    value: "individual",
    label: "Osoba prywatna",
    sub: "Umowa o dzieło / zlecenie",
    icon: User,
  },
  {
    value: "company",
    label: "Firma",
    sub: "Faktura VAT, rozliczenie B2B",
    icon: Building2,
  },
];

export function BillingTypeForm({ initialData }: Props) {
  const [selected, setSelected] = useState<BillingType | undefined>(
    initialData?.billingType
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base sm:text-lg">Typ rozliczenia</CardTitle>
          <Badge
            variant="warning"
            className="text-xs whitespace-nowrap w-fit"
          >
            Wkrótce dostępne
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Wybierz formę rozliczenia. Wpłynie to na rodzaj dokumentów wystawianych
          przez platformę przy wypłatach prowizji.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BILLING_OPTIONS.map(({ value, label, sub, icon: Icon }) => (
            <button
              key={value}
              type="button"
              disabled
              onClick={() => setSelected(value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors",
                "opacity-50 cursor-not-allowed",
                selected === value
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <Icon className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground border border-dashed border-zinc-200 rounded-lg px-3 py-2">
          Konfiguracja rozliczeń będzie dostępna w kolejnej wersji platformy.
          Skontaktuj się z administratorem w razie pilnych potrzeb.
        </p>
      </CardContent>
    </Card>
  );
}
