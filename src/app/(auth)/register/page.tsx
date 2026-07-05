import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          🚀 Beta — wkrótce dostępne
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Rejestracja tymczasowo niedostępna
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Platforma jest w fazie beta. Rejestracja zostanie otwarta wkrótce.
        </p>
      </div>

      <Button asChild className="w-full">
        <Link href="/login">Zaloguj się</Link>
      </Button>

      <p className="text-center text-sm text-slate-500">
        Pytania?{" "}
        <a
          href="mailto:hello@deneeu.pl"
          className="font-medium text-blue-600 transition-colors hover:text-blue-500"
        >
          hello@deneeu.pl
        </a>
      </p>
    </div>
  );
}
