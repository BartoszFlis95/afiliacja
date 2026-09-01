"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, resendVerificationEmailAction } from "@/actions/auth.actions";

export function LoginForm({ passwordResetDone = false }: { passwordResetDone?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notVerifiedEmail, setNotVerifiedEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, startResendTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotVerifiedEmail(null);
    setResendMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (!result.success) {
        if (result.code === "EMAIL_NOT_VERIFIED") {
          setNotVerifiedEmail(result.email ?? null);
        } else {
          setError(result.error);
        }
        return;
      }
      // Brief delay lets the browser finish processing the Set-Cookie
      // header from the Server Action response before the next request.
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = result.redirectTo;
    });
  }

  function handleResend() {
    if (!notVerifiedEmail) return;
    setResendMessage(null);
    startResendTransition(async () => {
      const result = await resendVerificationEmailAction(notVerifiedEmail);
      setResendMessage(
        result.success
          ? "Wysłaliśmy nowy link weryfikacyjny."
          : result.error ?? "Nie udało się wysłać emaila."
      );
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Zaloguj się
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Witaj z powrotem — wpisz swoje dane.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {passwordResetDone && (
          <div
            role="status"
            className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
          >
            Hasło zmienione. Zaloguj się nowym hasłem.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {notVerifiedEmail && (
          <div
            role="alert"
            className="space-y-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
          >
            <p className="font-medium">⚠️ Email niezweryfikowany</p>
            <p>Potwierdź swój email przed logowaniem.</p>
            {resendMessage && <p className="text-xs">{resendMessage}</p>}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isResending}
              onClick={handleResend}
              className="border-warning/40 bg-card text-warning hover:bg-warning/15"
            >
              {isResending ? "Wysyłanie…" : "📧 Wyślij email ponownie"}
            </Button>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="ty@firma.com"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">
            Hasło
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            disabled={isPending}
          />
          <p className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:text-primary transition-colors"
            >
              Zapomniałeś hasła?
            </Link>
          </p>
        </div>

        <Button type="submit" loading={isPending} className="w-full mt-2">
          {isPending ? "Logowanie…" : "Zaloguj się"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:text-primary transition-colors"
        >
          Utwórz konto
        </Link>
      </p>
    </div>
  );
}
