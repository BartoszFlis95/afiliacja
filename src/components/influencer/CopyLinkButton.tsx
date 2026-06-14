// src/components/influencer/CopyLinkButton.tsx
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyLinkButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/r/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Nie udało się skopiować linku", error);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? "Skopiowano!" : "Kopiuj link"}
    </Button>
  );
}

export default CopyLinkButton;
