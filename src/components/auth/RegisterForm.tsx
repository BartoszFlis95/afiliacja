"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Megaphone } from "lucide-react";

import { registerAction } from "@/actions/auth.actions";
import {
  RegisterSchema,
  type RegisterSchemaType,
} from "@/lib/validations/auth.schema";
import { cn } from "@/lib/utils";
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

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
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
      role:            role ?? "",
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
      router.refresh();
      router.push("/");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Załóż konto
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Wybierz typ konta i podaj swoje dane.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Typ konta */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Typ konta</Label>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  disabled={isPending}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-lg border p-3.5 text-left transition-all",
                    "hover:border-indigo-300 hover:bg-indigo-50/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                    selected
                      ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <Icon className={cn("h-4 w-4", selected ? "text-indigo-600" : "text-gray-400")} />
                  <span className={cn("text-sm font-medium", selected ? "text-indigo-700" : "text-gray-700")}>
                    {option.title}
                  </span>
                  <span className="text-xs text-gray-500">{option.description}</span>
                </button>
              );
            })}
          </div>
          {errors.role && (
            <p className="text-xs text-red-600">{errors.role}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Hasło */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
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
            <p className="text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Powtórz hasło */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
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
            <p className="text-xs text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Tworzenie konta..." : "Zarejestruj się"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Masz już konto?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
