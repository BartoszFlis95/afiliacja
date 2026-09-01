"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Nie udało się skopiować kodu", error);
    }
  }

  return (
    <div data-surface="dark"
      className="overflow-hidden rounded-xl bg-sidebar">
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-sidebar-foreground/60">
          {language ?? "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Skopiowano
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Kopiuj
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-sidebar-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}
