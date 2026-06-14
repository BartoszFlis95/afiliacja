import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Utwórz konto — Deneeu",
};

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Utwórz konto
        </h1>
        <p className="text-sm text-zinc-500">
          Załóż konto w kilka sekund i zacznij współpracę.
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}
