"use client"

import { useEffect } from "react"

import { ErrorState } from "@/components/shared/ErrorState"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Pełny błąd zostaje w konsoli/logach, użytkownik dostaje tylko digest.
    console.error(error)
  }, [error])

  return <ErrorState reset={reset} digest={error.digest} />
}
