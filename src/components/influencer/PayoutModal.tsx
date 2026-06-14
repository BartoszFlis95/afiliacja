"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";

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
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(
    value
  );

export function PayoutModal({
  commissionId,
  amount,
}: {
  commissionId: string;
  amount: Prisma.Decimal | number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bankAccount, setBankAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const account = bankAccount.trim();
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
            Kwota do wypłaty: {formatPLN(Number(amount))}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bankAccount" className="font-medium text-zinc-700">
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
              className="border-zinc-300 focus-visible:ring-zinc-900"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-zinc-900 text-white hover:bg-zinc-700"
            >
              {isPending ? "Wysyłanie…" : "Złóż wniosek o wypłatę"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
