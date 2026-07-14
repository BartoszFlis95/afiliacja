"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resendVerificationEmailAction,
  verifyEmailAction,
} from "@/actions/auth.actions";

type Status = "idle" | "verifying" | "success" | "error";

export function VerifyEmailClient({
  token,
  email,
}: {
  token?: string;
  email?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState(email ?? "");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, startResendTransition] = useTransition();

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    verifyEmailAction(token).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setVerifyError(result.error ?? "Nie udało się potwierdzić adresu email.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    const timeout = setTimeout(() => router.push("/login"), 3000);
    return () => clearTimeout(timeout);
  }, [status, router]);

  function handleResend() {
    setResendMessage(null);
    startResendTransition(async () => {
      const result = await resendVerificationEmailAction(resendEmail);
      setResendMessage(
        result.success
          ? "Wysłaliśmy nowy link weryfikacyjny."
          : result.error ?? "Nie udało się wysłać emaila."
      );
    });
  }

  if (status === "verifying") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 animate-pulse text-blue-600" />
        </div>
        <h1 className="text-xl font-semibold text-[#0F172A]">Weryfikujemy Twój email…</h1>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-xl font-semibold text-[#0F172A]">Email potwierdzony! ✅</h1>
        <p className="text-sm text-slate-500">
          Za chwilę przekierujemy Cię do logowania…
        </p>
        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
          <Link href="/login">Przejdź do logowania</Link>
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="text-xl font-semibold text-[#0F172A]">Nie udało się potwierdzić ❌</h1>
        <p className="text-sm text-slate-500">{verifyError}</p>

        <div className="space-y-1.5 text-left">
          <Label htmlFor="resend-email" className="text-xs font-medium text-slate-700">
            Adres email
          </Label>
          <Input
            id="resend-email"
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="ty@firma.pl"
            disabled={isResending}
          />
        </div>

        {resendMessage && <p className="text-xs text-slate-500">{resendMessage}</p>}

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isResending}
          onClick={handleResend}
        >
          {isResending ? "Wysyłanie…" : "Wyślij ponownie"}
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Przejdź do logowania</Link>
        </Button>
      </div>
    );
  }

  // idle — brak tokena w URL: właśnie zarejestrowany użytkownik czeka na maila.
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <Mail className="h-6 w-6 text-blue-600" />
      </div>
      <h1 className="text-xl font-semibold text-[#0F172A]">Sprawdź swoją skrzynkę 📧</h1>
      <p className="text-sm text-slate-500">
        Wysłaliśmy link weryfikacyjny na{" "}
        {email ? <span className="font-medium text-[#0F172A]">{email}</span> : "Twój adres email"}.
      </p>
      <p className="text-xs text-slate-400">Link ważny przez 24 godziny.</p>

      {!email && (
        <div className="space-y-1.5 text-left">
          <Label htmlFor="resend-email" className="text-xs font-medium text-slate-700">
            Adres email
          </Label>
          <Input
            id="resend-email"
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="ty@firma.pl"
            disabled={isResending}
          />
        </div>
      )}

      {resendMessage && <p className="text-xs text-slate-500">{resendMessage}</p>}

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isResending}
        onClick={handleResend}
      >
        {isResending ? "Wysyłanie…" : "Wyślij ponownie"}
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href="/login">Przejdź do logowania</Link>
      </Button>
    </div>
  );
}
