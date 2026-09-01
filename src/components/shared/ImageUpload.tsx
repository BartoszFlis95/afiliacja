"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Upload, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Zdjęcie" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error ?? `Błąd serwera: ${response.status}`);
        return;
      }

      onChange(data.url);
    } catch (err) {
      console.error("[ImageUpload] fetch error:", err);
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Dozwolone tylko pliki graficzne");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Plik zbyt duży (max 10MB)");
      return;
    }
    uploadFile(file);
  }

  if (value) {
    return (
      <div className="flex flex-col gap-3">
        {label && <p className="text-sm font-medium text-foreground">{label}</p>}
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border bg-muted/50">
          <Image
            src={value}
            alt="Zdjęcie"
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="flex-1 sm:flex-none"
          >
            <Upload className="w-4 h-4 mr-2" />
            Zmień zdjęcie
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange("")}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileSelect(e.dataTransfer.files);
        }}
        className={[
          "border-2 border-dashed rounded-xl p-8",
          "flex flex-col items-center justify-center gap-3",
          "transition-all cursor-pointer min-h-[180px]",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/50 hover:border-border hover:bg-muted",
          isUploading ? "cursor-wait opacity-70 pointer-events-none" : "",
        ].join(" ")}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Przesyłanie...</p>
          </>
        ) : (
          <>
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Kliknij lub przeciągnij zdjęcie
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP do 10MB</p>
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-1"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Wybierz plik
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">⚠ {error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  );
}
