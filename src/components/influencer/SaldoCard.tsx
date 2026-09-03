import { Lock, Wallet } from "lucide-react";

import type { SaldoInfluencera } from "@/actions/influencer.actions";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function SaldoCard({ saldo }: { saldo: SaldoInfluencera }) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Twoje saldo</h2>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Zarobione łącznie</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCurrency(saldo.zarobioneLacznie)}
            </dd>
          </div>

          <div>
            <dt className="flex items-center gap-1 text-xs text-success">
              <Wallet className="h-3 w-3" />
              Do wypłaty
            </dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums text-success">
              {formatCurrency(saldo.doWyplaty)}
            </dd>
          </div>

          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Oczekujące
            </dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCurrency(saldo.zablokowane)}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Wypłacone</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-muted-foreground">
              {formatCurrency(saldo.wyplacone)}
            </dd>
          </div>
        </dl>

        {saldo.zablokowane > 0 && (
          <p className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Kwota oczekująca zostanie odblokowana po rozliczeniu marki za bieżący
            okres. Rozliczenia prowadzimy w cyklu miesięcznym — wypłacamy środki
            otrzymane wcześniej od marki.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
