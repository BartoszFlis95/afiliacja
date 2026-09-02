import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ustaw nowe hasło",
  description: "Ustaw nowe hasło do konta Deneeu.",
  // Strona transakcyjna: jednorazowy token w URL-u, zero wartości dla wyszukiwarki.
  robots: { index: false, follow: false },
};

import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  if (!params.token) {
    redirect("/forgot-password");
  }

  return <ResetPasswordForm token={params.token} />;
}
