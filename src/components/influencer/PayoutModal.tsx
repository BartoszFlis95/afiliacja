"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { requestPayoutAction } from "@/actions/commission.actions";
import { MINIMUM_PAYOUT } from "@/lib/constants";
import { maskIban } from "@/lib/utils";

const formatPLN = (value: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);

interface BankDetails {
  hasBankDetails: boolean;
  preferredPayout: string | null;
  bankAccountIban: string | null;
  paypalEmail: string | null;
}

interface PayoutModalProps {
  commissionId: string;
  amount: number;
  /** Suma wszystkich zatwierdzonych, jeszcze nie wypłaconych komisji influencera. */
  availableAmount: number;
  bankDetails?: BankDetails;
}

export function PayoutModal({ commissionId, amount, availableAmount, bankDetails }: PayoutModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bankAccount, setBankAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const usesSavedDetails = !!bankDetails;
  const belowMinimum = availableAmount < MINIMUM_PAYOUT;

  function getSavedAccountString(): string {
    if (!bankDetails) return "";
    if (bankDetails.preferredPayout === "paypal") return bankDetails.paypalEmail ?? "";
    return bankDetails.bankAccountIban ?? "";
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const account = usesSavedDetails ? getSavedAccountString() : bankAccount.trim();

    if (!account) {
      setError("Numer konta jest wymagany.");
      return;
    }

    startTransition(async () => {
      const result = await requestPayoutAction(commissionId, account);
      if (result.success) {
        setOpen(false);
        setBankAccount("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Wypłać
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wniosek o wypłatę</DialogTitle>
          <DialogDescription>
            Kwota do wypłaty: {formatPLN(amount)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            ℹ️ Minimalna kwota wypłaty: {MINIMUM_PAYOUT} zł
          </div>

          {belowMinimum ? (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
              <p className="text-sm font-medium text-warning">
                ⚠️ Za mało środków do wypłaty
              </p>
              <p className="mt-1 text-xs text-warning">
                Masz {formatPLN(availableAmount)}. Minimalna kwota wypłaty to{" "}
                {MINIMUM_PAYOUT} zł. Zbieraj prowizje i wróć gdy osiągniesz minimum.
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-success">
              Wypłacisz: {formatPLN(amount)}
            </p>
          )}

          {usesSavedDetails ? (
            <>
              {!bankDetails!.hasBankDetails ? (
                <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-3 text-sm text-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Brak danych bankowych</p>
                    <p className="mt-0.5 text-xs">
                      Uzupełnij dane bankowe w{" "}
                      <Link href="/influencer/settings?tab=bank" className="underline" onClick={() => setOpen(false)}>
                        ustawieniach
                      </Link>
                      , aby móc zlecić wypłatę.
                    </p>
                  </div>
                </div>
              ) : !belowMinimum ? (
                <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {bankDetails!.preferredPayout === "paypal" ? "Konto PayPal" : "Numer konta IBAN"}
                  </p>
                  <p className="font-mono text-sm font-medium text-foreground">
                    {bankDetails!.preferredPayout === "paypal"
                      ? bankDetails!.paypalEmail
                      : maskIban(bankDetails!.bankAccountIban!)}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="bankAccount" className="font-medium text-foreground">
                Numer konta bankowego
              </Label>
              <Input
                id="bankAccount"
                name="bankAccount"
                value={bankAccount}
                onChange={(event) => setBankAccount(event.target.value)}
                placeholder="PL00 0000 0000 0000 0000 0000 0000"
                autoComplete="off"
                required
                disabled={isPending}
                className="border-border focus-visible:ring-foreground"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || belowMinimum || (usesSavedDetails && !bankDetails!.hasBankDetails)}
              
            >
              {isPending ? "Wysyłanie…" : "Złóż wniosek o wypłatę"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
