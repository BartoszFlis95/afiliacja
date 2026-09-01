"use client"

import Link from "next/link"
import { AlertTriangle, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Wspólna treść ekranów błędu (error.tsx w każdym segmencie).
 *
 * Świadomie NIE pokazujemy `error.message`. W produkcyjnym buildzie Next i tak
 * go wycina, a lokalnie bywa to surowy komunikat z Prismy albo Stripe'a —
 * czyli szczegóły infrastruktury pokazane użytkownikowi. Zamiast tego dajemy
 * `digest`: krótki identyfikator, który da się dopasować do wpisu w logach
 * serwera, więc zgłoszenie „mam kod X" jest realnie użyteczne dla supportu.
 */
export function ErrorState({
  reset,
  digest,
  title = "Coś poszło nie tak",
  description = "Nie udało się wczytać tej strony. Spróbuj ponownie — jeśli błąd się powtarza, daj nam znać.",
  homeHref = "/",
  homeLabel = "Strona główna",
}: {
  reset: () => void
  digest?: string
  title?: string
  description?: string
  homeHref?: string
  homeLabel?: string
}) {
  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
      </div>

      <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
        <Button onClick={reset}>
          <RotateCw aria-hidden="true" />
          Spróbuj ponownie
        </Button>
        <Button variant="outline" asChild>
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
      </div>

      {digest && (
        <p className="mt-6 text-xs text-muted-foreground">
          Kod błędu: <code className="font-mono text-foreground">{digest}</code>
        </p>
      )}
    </div>
  )
}
