"use client";

import { useState, useTransition } from "react";
import { Building2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { updateBillingTypeAction } from "@/actions/influencer.actions";

type BillingType = "INDIVIDUAL" | "COMPANY";

interface BillingData {
  billingType?: BillingType | null;
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
    value: "INDIVIDUAL",
    label: "Osoba prywatna",
    sub: "Umowa o dzieło / zlecenie",
    icon: User,
  },
  {
    value: "COMPANY",
    label: "Firma",
    sub: "Faktura VAT, rozliczenie B2B",
    icon: Building2,
  },
];

export function BillingTypeForm({ initialData }: Props) {
  const [selected, setSelected] = useState<BillingType | undefined>(
    initialData?.billingType ?? undefined
  );
  const [isPending, startTransition] = useTransition();

  function handleSelect(value: BillingType) {
    if (value === selected || isPending) return;
    const previous = selected;
    setSelected(value);

    startTransition(async () => {
      const result = await updateBillingTypeAction(value);
      if (!result.success) {
        setSelected(previous);
        toast({
          title: "Nie udało się zapisać typu rozliczenia",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Typ rozliczenia zapisany." });
    });
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg">Typ rozliczenia</CardTitle>
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
              disabled={isPending}
              onClick={() => handleSelect(value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors",
                isPending && "opacity-60 cursor-wait",
                selected === value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
