"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateAffiliateLinkAction } from "@/actions/influencer.actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export function GenerateLinkButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await generateAffiliateLinkAction(productId);
      if (result.success) {
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Błąd generowania linku",
          description: result.error ?? "Spróbuj ponownie.",
        });
      }
    });
  }

  return (
    <Button size="sm" className="w-full" disabled={isPending} onClick={handleClick}>
      {isPending ? "Generowanie..." : "Generuj link"}
    </Button>
  );
}