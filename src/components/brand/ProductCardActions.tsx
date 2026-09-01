"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleProductStatusAction, deleteProductAction } from "@/actions/product.actions";
import { Button } from "@/components/ui/button";

export function ProductCardActions({
  productId,
  status,
}: {
  productId: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isActive = status === "ACTIVE";

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleProductStatusAction(productId);
      if (result.success) {
        router.refresh();
      } else {
        toast.error("Błąd", { description: result.error });
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Na pewno usunąć ten produkt? Tej operacji nie można cofnąć.")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.success) {
        router.refresh();
      } else {
        toast.error("Błąd", { description: result.error });
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/brand/products/${productId}`}>Edytuj</Link>
      </Button>
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggle}>
        {isActive ? "Dezaktywuj" : "Aktywuj"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
        className="text-red-600 hover:bg-red-50"
      >
        Usuń
      </Button>
    </div>
  );
}
