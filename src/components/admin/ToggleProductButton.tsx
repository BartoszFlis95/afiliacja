"use client";

import { useTransition } from "react";

import { toggleProductStatusAction } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";

export function ToggleProductButton({
  productId,
  status,
}: {
  productId: string;
  status: "ACTIVE" | "INACTIVE";
}) {
  const [isPending, startTransition] = useTransition();
  const isActive = status === "ACTIVE";

  function handleClick() {
    startTransition(async () => {
      try {
        await toggleProductStatusAction(productId);
      } catch (error) {
        console.error("toggleProductStatusAction failed", error);
      }
    });
  }

  return (
    <Button
      variant={isActive ? "destructive" : "default"}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "..." : isActive ? "Dezaktywuj" : "Aktywuj"}
    </Button>
  );
}
