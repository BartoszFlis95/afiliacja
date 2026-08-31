"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { forgotPasswordAction } from "@/actions/auth.actions";
import { ForgotPasswordSchema } from "@/lib/validations/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    startTransition(async () => {
      const result = await forgotPasswordAction(parsed.data.email);
      if (!result.success) {
        setError(result.error ?? "Nie udało się wysłać emaila.");
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Sprawdź skrzynkę email
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Jeśli konto o podanym adresie istnieje, wysłaliśmy na nie link do
            zresetowania hasła. Link jest ważny przez 1 godzinę.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Wróć do logowania
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Nie pamiętasz hasła?
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Podaj swój email, a wyślemy Ci link do zresetowania hasła.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ty@firma.com"
            disabled={isPending}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full mt-2">
          {isPending ? "Wysyłanie…" : "Wyślij link resetujący"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          Wróć do logowania
        </Link>
      </p>
    </div>
  );
}
