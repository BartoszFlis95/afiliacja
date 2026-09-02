import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zaloguj się",
  description: "Zaloguj się do panelu Deneeu — zarządzaj kampaniami afiliacyjnymi, prowizjami i wypłatami.",
  alternates: { canonical: "/login" },
};

import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;

  return <LoginForm passwordResetDone={params.reset === "success"} />;
}
