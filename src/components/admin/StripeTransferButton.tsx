"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { executeStripeTransferAction } from "@/actions/stripe.actions";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";

interface StripeTransferButtonProps {
  payoutId: string;
  amount: number;
  influencerName: string;
  stripeReady: boolean;
}

const formatPLN = (value: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);

export function StripeTransferButton({
  payoutId,
  amount,
  influencerName,
  stripeReady,
}: StripeTransferButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleTransfer() {
    startTransition(async () => {
      const result = await executeStripeTransferAction(payoutId);
      if (result.success) {
        toast({
          title: "Transfer wysłany",
          description: `${formatPLN(amount)} przelane do ${influencerName} przez Stripe.`,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Transfer nie powiódł się",
          description: result.error ?? "Spróbuj ponownie.",
        });
      }
    });
  }

  if (!stripeReady) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button size="sm" variant="outline" disabled>
          💳 Ręczny przelew IBAN
        </Button>
        <p className="text-xs text-slate-500">Influencer nie połączył Stripe</p>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={handleTransfer} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Zap className="mr-2 h-4 w-4" />
      )}
      Wyślij przez Stripe
    </Button>
  );
}
