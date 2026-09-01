"use client"

import { useEffect } from "react"

import { ErrorState } from "@/components/shared/ErrorState"

/**
 * Granica błędu wewnątrz layoutu paneli — sidebar i nagłówek zostają na
 * ekranie, więc po błędzie na jednej podstronie da się przejść dalej bez
 * przeładowania całej aplikacji.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorState
      reset={reset}
      digest={error.digest}
      description="Nie udało się wczytać tych danych. Spróbuj ponownie — pozostałe sekcje panelu działają normalnie."
      homeHref="/"
      homeLabel="Wróć na start"
    />
  )
}
