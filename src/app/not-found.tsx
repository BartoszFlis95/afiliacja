import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-8xl font-extrabold tracking-tight text-slate-200 sm:text-9xl">
        404
      </p>

      <div className="mt-4 flex items-center gap-2 text-slate-500">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span className="text-lg font-medium text-slate-700">
          Strona nie istnieje
        </span>
      </div>

      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Strona, której szukasz, nie została odnaleziona. Mogła zostać
        przeniesiona lub usunięta.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">Wróć do strony głównej</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Zaloguj się</Link>
        </Button>
      </div>
    </div>
  );
}
