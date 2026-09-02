import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weryfikacja adresu email",
  description: "Potwierdź adres email w Deneeu.",
  // Strona transakcyjna: jednorazowy token w URL-u, zero wartości dla wyszukiwarki.
  robots: { index: false, follow: false },
};

import Link from "next/link";

import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15 p-8">
      <div className="w-full max-w-sm rounded-2xl border border-primary/20 bg-card p-8 shadow-xl">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="text-2xl font-black text-foreground">Deneeu</span>
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        </Link>
        <VerifyEmailClient token={token} email={email} />
      </div>
    </div>
  );
}
