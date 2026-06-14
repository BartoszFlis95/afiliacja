"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  approveCommissionAction,
  rejectCommissionAction,
} from "@/actions/commission.actions";

export function CommissionActions({
  commissionId,
  status,
}: {
  commissionId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status !== "PENDING") {
    return null;
  }

  function run(action: typeof approveCommissionAction) {
    setError(null);
    startTransition(async () => {
      const result = await action(commissionId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(approveCommissionAction)}
        >
          Zatwierdź
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => run(rejectCommissionAction)}
        >
          Odrzuć
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
