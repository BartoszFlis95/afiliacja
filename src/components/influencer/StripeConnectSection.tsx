"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createStripeOnboardingLinkAction,
  getStripeAccountStatusAction,
  getStripeExpressDashboardLinkAction,
} from "@/actions/stripe.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { StripeConnectStatus } from "@/types";

interface Props {
  initialStatus: StripeConnectStatus;
  autoRefresh?: boolean;
}

export function StripeConnectSection({ initialStatus, autoRefresh = false }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  function handleConnect() {
    startTransition(async () => {
      const result = await createStripeOnboardingLinkAction();
      if (result.success && result.data) {
        window.location.href = result.data.url;
      } else {
        toast.error("Błąd", {
          description: result.error ?? "Nie udało się połączyć ze Stripe.",
        });
      }
    });
  }

  function handleRefreshStatus() {
    startTransition(async () => {
      const result = await getStripeAccountStatusAction();
      if (result.success && result.data) {
        setStatus(result.data);
        router.refresh();
      } else {
        toast.error("Błąd", {
          description: result.error ?? "Nie udało się odświeżyć statusu.",
        });
      }
    });
  }

  function handleOpenDashboard() {
    startTransition(async () => {
      const result = await getStripeExpressDashboardLinkAction();
      if (result.success && result.data) {
        window.open(result.data.url, "_blank");
      } else {
        toast.error("Błąd", {
          description: result.error ?? "Nie udało się otworzyć panelu Stripe.",
        });
      }
    });
  }

  // Po powrocie z onboardingu Stripe (return_url/refresh_url) odśwież status
  // razem ze Stripe zamiast polegać na przeterminowanych danych z bazy.
  useEffect(() => {
    if (autoRefresh) {
      handleRefreshStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  if (status.status === "not_connected") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CreditCard className="h-5 w-5" />
            Połącz konto Stripe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Połącz swoje konto bankowe przez Stripe, aby otrzymywać automatyczne wypłaty
            prowizji.
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Bezpieczne połączenie
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Wypłaty w PLN
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Automatyczne przelewy
            </li>
          </ul>
          <Button
            onClick={handleConnect}
            disabled={isPending}
            className="bg-slate-900 hover:bg-slate-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            🔗 Połącz z Stripe
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status.status === "pending") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Clock className="h-5 w-5 text-amber-500" />
            Weryfikacja w toku
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Twoje konto Stripe jest weryfikowane. Może to potrwać 1-2 dni robocze.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRefreshStatus} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sprawdź status
            </Button>
            <Button variant="outline" onClick={handleConnect} disabled={isPending}>
              <ExternalLink className="mr-2 h-4 w-4" /> Dokończ weryfikację
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status.status === "restricted") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Wymagane działanie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Stripe wymaga dodatkowych informacji, aby aktywować Twoje konto.
          </p>
          <Button
            onClick={handleConnect}
            disabled={isPending}
            className="bg-slate-900 hover:bg-slate-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ExternalLink className="mr-2 h-4 w-4" /> Uzupełnij dane w Stripe
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Stripe aktywny
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Twoje konto Stripe jest aktywne. Wypłaty będą realizowane automatycznie po
          zatwierdzeniu przez admina.
        </p>
        <Button variant="outline" onClick={handleOpenDashboard} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <ExternalLink className="mr-2 h-4 w-4" /> Otwórz Stripe Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
