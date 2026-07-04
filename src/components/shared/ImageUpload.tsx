"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Endpoint = keyof OurFileRouter;

interface ImageUploadProps {
  endpoint: Endpoint;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({
  endpoint,
  value,
  onChange,
  label,
  className,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Podgląd"
            className="h-32 w-32 rounded-lg border border-zinc-200 object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full border border-zinc-200 bg-zinc-100 hover:bg-red-50 hover:text-red-600"
            onClick={() => {
              setError(null);
              onChange("");
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <UploadDropzone
          endpoint={endpoint}
          onClientUploadComplete={(res) => {
            setError(null);
            const url = res[0]?.serverData?.url ?? res[0]?.ufsUrl;
            if (url) onChange(url);
          }}
          onUploadError={(e) => setError(e.message)}
          appearance={{
            container:
              "border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer",
            label: "text-sm text-zinc-500 mt-2",
            allowedContent: "text-xs text-zinc-400",
            button:
              "mt-2 bg-zinc-900 text-white text-sm px-4 py-2 rounded-md hover:bg-zinc-700 ut-uploading:cursor-not-allowed ut-uploading:opacity-60",
          }}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
