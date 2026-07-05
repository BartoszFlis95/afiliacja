"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportCSVButtonProps {
  /** Klucze obiektów to już gotowe polskie nagłówki kolumn; wartości powinny być wstępnie sformatowane (daty DD.MM.YYYY, kwoty z kropką). */
  data: Record<string, string | number>[];
  filename: string;
  label?: string;
}

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ExportCSVButton({ data, filename, label = "Eksportuj CSV" }: ExportCSVButtonProps) {
  function handleExport() {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const lines = [
      headers.map(csvEscape).join(";"),
      ...data.map((row) => headers.map((h) => csvEscape(row[h])).join(";")),
    ];
    // BOM na początku, żeby Excel poprawnie rozpoznał UTF-8 i polskie znaki.
    const BOM = "﻿";
    const blob = new Blob([BOM + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={data.length === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
