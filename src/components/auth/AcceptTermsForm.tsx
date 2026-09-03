"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { acceptTermsAction } from "@/actions/legal.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function AcceptTermsForm({ redirectTo }: { redirectTo: string }) {
  const [tos, setTos] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const komplet = tos && privacy;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!komplet) {
      setError("Zaznacz oba pola, aby przejść dalej.");
      return;
    }

    startTransition(async () => {
      const wynik = await acceptTermsAction(tos, privacy);
      if (!wynik.success) {
        setError(wynik.error);
        return;
      }
      // twarde przejście, nie router.push: layout panelu czyta akceptację
      // z bazy, więc potrzebujemy pełnego żądania, a nie nawigacji klienckiej
      window.location.href = redirectTo;
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="tos"
            checked={tos}
            onCheckedChange={(v) => setTos(v === true)}
            disabled={isPending}
            className="mt-0.5"
          />
          <Label htmlFor="tos" className="text-sm font-normal leading-snug">
            Akceptuję{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Regulamin platformy
            </Link>
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="privacy"
            checked={privacy}
            onCheckedChange={(v) => setPrivacy(v === true)}
            disabled={isPending}
            className="mt-0.5"
          />
          <Label htmlFor="privacy" className="text-sm font-normal leading-snug">
            Akceptuję{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Politykę prywatności
            </Link>
          </Label>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={isPending} disabled={!komplet}>
        {isPending ? "Zapisywanie..." : "Akceptuję i przechodzę dalej"}
      </Button>
    </form>
  );
}
