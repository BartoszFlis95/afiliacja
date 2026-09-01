"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WebhookSectionProps {
  apiKey: string;
  webhookSecret: string;
}

// Data wejścia w życie wymogu podpisu HMAC — patrz sekcja "Ważne" niżej.
const HMAC_REQUIRED_SINCE = "22.07.2026";

export function WebhookSection({ apiKey, webhookSecret }: WebhookSectionProps) {
  const [showSecret, setShowSecret] = useState(false);
  const webhookUrl = "https://www.deneeu.pl/api/conversion";

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <Card className="w-full">
      <CardHeader className="p-4 pb-4 md:p-6 md:pb-4">
        <CardTitle>Integracja ze sklepem (Webhook)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Skonfiguruj swój sklep, aby automatycznie zgłaszał zakupy do deneeu.pl
          i rejestrował konwersje influencerów.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Ważne:</strong> Od {HMAC_REQUIRED_SINCE} weryfikacja podpisu
          HMAC jest wymagana. Żądania bez nagłówka{" "}
          <code className="font-mono">x-signature</code> będą odrzucane (HTTP
          401). Zaktualizuj swoją integrację przed wdrożeniem.
        </div>

        <div className="space-y-1.5">
          <Label>Webhook URL</Label>
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="font-mono text-sm" />
            <Button type="button" variant="outline" onClick={() => copy(webhookUrl)}>
              Kopiuj
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>API Key</Label>
          <div className="flex gap-2">
            <Input value={apiKey} readOnly className="font-mono text-sm" />
            <Button type="button" variant="outline" onClick={() => copy(apiKey)}>
              Kopiuj
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Umieść jako nagłówek <code className="font-mono">x-api-key</code> w każdym żądaniu.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label>Webhook Secret (HMAC SHA-256)</Label>
            <Badge variant="destructive">WYMAGANE</Badge>
          </div>
          <div className="flex gap-2">
            <Input
              value={webhookSecret}
              readOnly
              type={showSecret ? "text" : "password"}
              className="font-mono text-sm"
            />
            <Button type="button" variant="outline" onClick={() => setShowSecret((v) => !v)}>
              {showSecret ? "Ukryj" : "Pokaż"}
            </Button>
            <Button type="button" variant="outline" onClick={() => copy(webhookSecret)}>
              Kopiuj
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Wymagane: oblicz <code className="font-mono">HMAC-SHA256(body, secret)</code> i prześlij jako nagłówek{" "}
            <code className="font-mono">x-signature</code>. Żądania bez tego nagłówka lub z
            nieprawidłowym podpisem zwracają <code className="font-mono">401</code>.
          </p>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Jak używać:</strong> Po każdym udanym zakupie wyślij{" "}
          <code className="font-mono">POST {webhookUrl}</code> z nagłówkami{" "}
          <code className="font-mono">x-api-key</code> i{" "}
          <code className="font-mono">x-signature</code> oraz treścią JSON:
          <pre className="mt-2 rounded bg-amber-100 p-2 text-xs overflow-x-auto">{`{
  "orderId": "zamowienie-123",
  "amount": 299.99,
  "ref": "<influencer_profile_id>",
  "email": "klient@email.pl"
}`}</pre>
          Wartość <code className="font-mono">ref</code> pochodzi z cookie{" "}
          <code className="font-mono">deneeu_ref</code> ustawianego przez link afiliacyjny.
          <p className="mt-3 font-medium">Przykład (Node.js) z podpisem HMAC:</p>
          <pre className="mt-2 rounded bg-amber-100 p-2 text-xs overflow-x-auto">{`const crypto = require("crypto");

const payload = JSON.stringify({
  orderId: "zamowienie-123",
  amount: 299.99,
  ref: influencerProfileId,
  email: "klient@email.pl",
});

const signature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(payload)
  .digest("hex");

await fetch("${webhookUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    "x-signature": signature,
  },
  body: payload,
});`}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
