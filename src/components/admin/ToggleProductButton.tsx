"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { toggleProductStatusAction } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ProductStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export function ToggleProductButton({
  productId,
  status,
}: {
  productId: string;
  status: ProductStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isActive = status === "ACTIVE";

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await toggleProductStatusAction(productId);

        if (
          result &&
          typeof result === "object" &&
          "success" in result &&
          result.success === false
        ) {
          toast.error("Błąd", {
            description:
              ("error" in result && typeof result.error === "string" && result.error) ||
              "Nie udało się zmienić statusu produktu.",
          });
          return;
        }

        router.refresh();
      } catch (error) {
        toast.error("Błąd", {
          description:
            error instanceof Error
              ? error.message
              : "Nie udało się zmienić statusu produktu.",
        });
      }
    });
  }

  return (
    <Button
      variant={isActive ? "destructive" : "default"}
      size="sm"
      loading={isPending}
      onClick={handleClick}
    >
      {isPending ? "..." : isActive ? "Dezaktywuj" : "Aktywuj"}
    </Button>
  );
}
