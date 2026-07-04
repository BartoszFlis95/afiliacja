"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadDropzone } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface ImageUploadProps {
  endpoint: keyof OurFileRouter;
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({
  endpoint,
  value,
  onChange,
  label = "Prześlij zdjęcie",
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);

  if (value) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-200">
          <Image
            src={value}
            alt="Zdjęcie produktu"
            fill
            className="object-cover"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange("")}
          className="text-red-500 border-red-200 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-2" />
          Usuń zdjęcie
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-sm font-medium text-zinc-700">{label}</p>
      )}

      <div className="border-2 border-dashed border-zinc-300 rounded-xl hover:border-zinc-500 transition-colors bg-zinc-50 flex flex-col items-center justify-center p-6">
        <ImageIcon className="w-10 h-10 text-zinc-400 mb-3 pointer-events-none" />
        <p className="text-sm text-zinc-600 font-medium mb-1 pointer-events-none">
          Kliknij lub przeciągnij zdjęcie
        </p>
        <p className="text-xs text-zinc-400 mb-3 pointer-events-none">
          PNG, JPG, WEBP do 4MB
        </p>

        <UploadDropzone
          endpoint={endpoint}
          onClientUploadComplete={(res) => {
            const url = res?.[0]?.url ?? res?.[0]?.serverData?.url;
            if (url) {
              onChange(url);
              setError(null);
            }
          }}
          onUploadError={(err) => {
            setError(err.message);
          }}
          appearance={{
            container: "w-full border-0 bg-transparent p-0 m-0 min-h-0",
            label: "hidden",
            allowedContent: "hidden",
            button:
              "bg-zinc-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-zinc-700 transition-colors ut-readying:opacity-50 ut-uploading:opacity-50",
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
