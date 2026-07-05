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

const formatPLN = (value: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);

function maskIban(iban: string): string {
  const clean = iban.replace(/\s/g, "");
  if (clean.length < 6) return "****";
  const country = clean.slice(0, 2);
  const last4 = clean.slice(-4);
  return `${country}** **** **** **** **** **** ${last4}`;
}

interface BankDetails {
  hasBankDetails: boolean;
  preferredPayout: string | null;
  bankAccountIban: string | null;
  paypalEmail: string | null;
  minimumPayout: number | null;
}

interface PayoutModalProps {
  commissionId: string;
  amount: number;
  bankDetails?: BankDetails;
}

export function PayoutModal({ commissionId, amount, bankDetails }: PayoutModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bankAccount, setBankAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const usesSavedDetails = !!bankDetails;
  const minimumPayout = bankDetails?.minimumPayout ?? 50;
  const belowMinimum = usesSavedDetails && amount < minimumPayout;

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
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {usesSavedDetails ? (
            <>
              {!bankDetails!.hasBankDetails ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
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
              ) : belowMinimum ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Minimalna kwota wypłaty to <strong>{formatPLN(minimumPayout)}</strong>.
                    Obecna kwota ({formatPLN(amount)}) jest za niska.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {bankDetails!.preferredPayout === "paypal" ? "Konto PayPal" : "Numer konta IBAN"}
                  </p>
                  <p className="font-mono text-sm font-medium text-slate-900">
                    {bankDetails!.preferredPayout === "paypal"
                      ? bankDetails!.paypalEmail
                      : maskIban(bankDetails!.bankAccountIban!)}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="bankAccount" className="font-medium text-slate-700">
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
                className="border-slate-300 focus-visible:ring-slate-900"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || (usesSavedDetails && (!bankDetails!.hasBankDetails || belowMinimum))}
              className="bg-slate-900 text-white hover:bg-slate-700"
            >
              {isPending ? "Wysyłanie…" : "Złóż wniosek o wypłatę"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
