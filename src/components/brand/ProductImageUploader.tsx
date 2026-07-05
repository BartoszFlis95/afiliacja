"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { updateProductImageAction } from "@/actions/upload.actions";
import { toast } from "@/hooks/use-toast";

interface ProductImageUploaderProps {
  productId: string;
  currentImageUrl?: string | null;
}

export function ProductImageUploader({
  productId,
  currentImageUrl,
}: ProductImageUploaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(url: string) {
    startTransition(async () => {
      const result = await updateProductImageAction(productId, url);
      if (result.success) {
        toast({ title: url ? "Zdjęcie zostało zapisane." : "Zdjęcie zostało usunięte." });
        router.refresh();
      } else {
        toast({
          title: "Błąd",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-1">
      <ImageUpload
        value={currentImageUrl ?? ""}
        onChange={handleChange}
        label="Zdjęcie produktu"
      />
      {isPending && (
        <p className="text-xs text-slate-400">Zapisywanie...</p>
      )}
    </div>
  );
}
