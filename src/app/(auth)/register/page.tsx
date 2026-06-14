import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          🚀 Beta — wkrótce dostępne
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Rejestracja tymczasowo niedostępna
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Platforma jest w fazie beta. Rejestracja zostanie otwarta wkrótce.
        </p>
      </div>

      <Button asChild className="w-full bg-zinc-900 text-white hover:bg-zinc-700">
        <Link href="/login">Zaloguj się</Link>
      </Button>

      <p className="text-center text-sm text-gray-500">
        Pytania?{" "}
        <a
          href="mailto:hello@deneeu.pl"
          className="font-medium text-indigo-600 transition-colors hover:text-indigo-500"
        >
          hello@deneeu.pl
        </a>
      </p>
    </div>
  );
}
