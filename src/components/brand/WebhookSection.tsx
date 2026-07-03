"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface WebhookSectionProps {
  apiKey: string;
  webhookSecret: string;
}

export function WebhookSection({ apiKey, webhookSecret }: WebhookSectionProps) {
  const [showSecret, setShowSecret] = useState(false);
  const webhookUrl = "https://www.deneeu.pl/api/conversion";

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integracja ze sklepem (Webhook)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Skonfiguruj swój sklep, aby automatycznie zgłaszał zakupy do deneeu.pl
          i rejestrował konwersje influencerów.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Label>Webhook Secret (HMAC SHA-256)</Label>
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
            Opcjonalnie: oblicz <code className="font-mono">HMAC-SHA256(body, secret)</code> i prześlij jako nagłówek{" "}
            <code className="font-mono">x-signature</code>.
          </p>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Jak używać:</strong> Po każdym udanym zakupie wyślij{" "}
          <code className="font-mono">POST {webhookUrl}</code> z nagłówkiem{" "}
          <code className="font-mono">x-api-key</code> i treścią JSON:
          <pre className="mt-2 rounded bg-amber-100 p-2 text-xs overflow-x-auto">{`{
  "orderId": "zamowienie-123",
  "amount": 299.99,
  "ref": "<influencer_profile_id>",
  "email": "klient@email.pl"
}`}</pre>
          Wartość <code className="font-mono">ref</code> pochodzi z cookie{" "}
          <code className="font-mono">deneeu_ref</code> ustawianego przez link afiliacyjny.
        </div>
      </CardContent>
    </Card>
  );
}
