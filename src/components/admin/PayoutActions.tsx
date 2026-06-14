"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  adminApprovePayoutAction,
  adminMarkPayoutPaidAction,
} from "@/actions/commission.actions";

export function PayoutActions({
  payoutId,
  status,
}: {
  payoutId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: typeof adminApprovePayoutAction) {
    setError(null);
    startTransition(async () => {
      const result = await action(payoutId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (status !== "PENDING" && status !== "PROCESSING") {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {status === "PENDING" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(adminApprovePayoutAction)}
        >
          Zatwierdź wypłatę
        </Button>
      )}
      {status === "PROCESSING" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(adminMarkPayoutPaidAction)}
        >
          Oznacz jako wypłacone
        </Button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
