"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/actions/auth.actions";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Zaloguj się
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Witaj z powrotem — wpisz swoje dane.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
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
        </div>

        <Button type="submit" disabled={isPending} className="w-full mt-2">
          {isPending ? "Logowanie…" : "Zaloguj się"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Nie masz konta?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          Utwórz konto
        </Link>
      </p>
    </div>
  );
}
