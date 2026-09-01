"use client";

import { useState, useTransition } from "react";
import { Building2, Megaphone } from "lucide-react";

import { registerAction } from "@/actions/auth.actions";
import {
  RegisterSchema,
  type RegisterSchemaType,
} from "@/lib/validations/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Role = "BRAND" | "INFLUENCER";
type FieldErrors = Partial<Record<keyof RegisterSchemaType, string>>;

const ROLE_OPTIONS: {
  value: Role;
  title: string;
  description: string;
  icon: typeof Building2;
}[] = [
  {
    value: "BRAND",
    title: "Marka",
    description: "Szukam influencerów do kampanii.",
    icon: Building2,
  },
  {
    value: "INFLUENCER",
    title: "Influencer",
    description: "Szukam współprac z markami.",
    icon: Megaphone,
  },
];

interface Props {
  inviteCode?: string;
  defaultRole?: Role;
}

export function RegisterForm({ inviteCode = "", defaultRole }: Props) {
  const inviteFromUrl = inviteCode;
  const [role, setRole] = useState<Role>(
    inviteFromUrl ? "BRAND" : defaultRole === "INFLUENCER" ? "INFLUENCER" : "BRAND"
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const formData = new FormData(event.currentTarget);

    const values = {
      email:           String(formData.get("email") ?? ""),
      password:        String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      role,
      inviteCode:      role === "BRAND" ? String(formData.get("inviteCode") ?? "") : undefined,
    };

    const parsed = RegisterSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof RegisterSchemaType;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const result = await registerAction(formData);
      if (!result.success) {
        setFormError(result.error ?? "Rejestracja nie powiodła się.");
        return;
      }
      if (result.redirectTo) {
        window.location.href = result.redirectTo;
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Załóż konto
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wybierz typ konta i podaj swoje dane.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/*
          Wybór typu konta to natywna grupa radio, nie dwa przyciski z
          aria-pressed. aria-pressed opisuje niezależny przełącznik — czytnik
          ekranu ogłaszał dwa osobne przyciski i nie przekazywał, że wybór jest
          rozłączny. Natywne <input type="radio"> w <fieldset> daje obsługę
          strzałkami, komunikat "1 z 2", i wartość trafia do FormData sama,
          więc osobny hidden input przestał być potrzebny.
        */}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-foreground">
            Typ konta
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className="group relative flex cursor-pointer flex-col items-start gap-1.5 rounded-lg border border-border bg-card p-3.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:ring-1 has-[:checked]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => setRole(option.value)}
                    disabled={isPending}
                    className="sr-only"
                  />
                  <Icon className="h-4 w-4 text-muted-foreground group-has-[:checked]:text-primary" />
                  <span className="text-sm font-medium text-foreground group-has-[:checked]:text-primary">
                    {option.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.role && (
            <p role="alert" className="text-xs text-destructive">
              {errors.role}
            </p>
          )}
        </fieldset>

        {/* Kod zaproszenia — wymagany tylko dla kont typu Marka */}
        {role === "BRAND" && (
          <div className="space-y-1.5">
            <Label htmlFor="inviteCode">
              Kod zaproszenia
            </Label>
            <Input
              id="inviteCode"
              name="inviteCode"
              type="text"
              placeholder="INV-XXXXXXXX"
              autoComplete="off"
              defaultValue={inviteFromUrl}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Rejestracja marek odbywa się na zaproszenie. Kod otrzymasz od zespołu Deneeu.
            </p>
            {errors.inviteCode && (
              <p className="text-xs text-destructive">{errors.inviteCode}</p>
            )}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ty@firma.pl"
            autoComplete="email"
            disabled={isPending}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Hasło */}
        <div className="space-y-1.5">
          <Label htmlFor="password">
            Hasło
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        {/* Powtórz hasło */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">
            Powtórz hasło
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={isPending}>
          {isPending ? "Tworzenie konta..." : "Zarejestruj się"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary transition-colors"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
