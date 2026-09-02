import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Odzyskaj hasło",
  description: "Zresetuj hasło do konta Deneeu.",
  // Strona transakcyjna: jednorazowy token w URL-u, zero wartości dla wyszukiwarki.
  robots: { index: false, follow: false },
};

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
