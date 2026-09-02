import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Załóż konto",
  description: "Dołącz do Deneeu jako marka lub influencer. Darmowa rejestracja, bez karty kredytowej.",
  alternates: { canonical: "/register" },
};

import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; role?: string }>;
}) {
  const params = await searchParams;

  return (
    <RegisterForm
      inviteCode={params.invite ?? ""}
      defaultRole={params.role === "INFLUENCER" ? "INFLUENCER" : undefined}
    />
  );
}
