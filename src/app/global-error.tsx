"use client"

import { useEffect } from "react"

/**
 * Ostatnia granica błędu — łapie awarie w samym root layoucie, czyli tam,
 * gdzie zwykłe error.tsx już się nie wyrenderuje.
 *
 * Zastępuje cały dokument, więc musi dostarczyć własne <html> i <body>, i nie
 * może polegać na niczym z layoutu: ani na providerach, ani na klasach
 * Tailwinda (globals.css może być właśnie tym, co się nie wczytało). Stąd
 * style inline i neutralna paleta działająca w obu motywach systemowych.
 */
export default function GlobalError({
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
    <html lang="pl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            Aplikacja nie mogła się uruchomić
          </h1>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            Wystąpił nieoczekiwany błąd. Odśwież stronę — jeśli problem się
            powtarza, skontaktuj się z nami na kontakt@deneeu.pl.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              cursor: "pointer",
              borderRadius: "0.5rem",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Odśwież
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              Kod błędu: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
