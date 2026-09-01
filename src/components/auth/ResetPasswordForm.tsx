"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { resetPasswordAction } from "@/actions/auth.actions";
import {
  ResetPasswordSchema,
  type ResetPasswordSchemaType,
} from "@/lib/validations/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = Partial<Record<keyof ResetPasswordSchemaType, string>>;

export function ResetPasswordForm({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const values = {
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    const parsed = ResetPasswordSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ResetPasswordSchemaType;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const result = await resetPasswordAction(token, parsed.data.password);
      if (!result.success) {
        if (result.code === "TOKEN_INVALID") {
          setTokenInvalid(true);
          return;
        }
        setFormError(result.error ?? "Nie udało się zresetować hasła.");
        return;
      }

      // Krótkie opóźnienie na spójność z resztą flow logowania/rejestracji
      // w tym projekcie (patrz LoginForm/RegisterForm) przed twardym redirectem.
      window.location.href = "/login?reset=success";
    });
  }

  if (tokenInvalid) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Link wygasł
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Ten link do resetowania hasła wygasł lub został już wykorzystany.
            Wygeneruj nowy, aby ustawić nowe hasło.
          </p>
        </div>

        <Link href="/forgot-password">
          <Button className="w-full">Wygeneruj nowy link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Ustaw nowe hasło
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Wpisz i potwierdź swoje nowe hasło.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password">
            Nowe hasło
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">
            Powtórz nowe hasło
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" loading={isPending} className="w-full mt-2">
          {isPending ? "Zapisywanie…" : "Zmień hasło"}
        </Button>
      </form>
    </div>
  );
}
