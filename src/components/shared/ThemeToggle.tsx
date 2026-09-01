"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"
import { THEME_STORAGE_KEY } from "@/components/shared/ThemeScript"

type Theme = "light" | "dark"

/**
 * Motyw żyje poza Reactem — ustawia go blokujący ThemeScript, wpisując klasę
 * na <html> jeszcze przed pierwszym malowaniem. Czytamy go więc przez
 * useSyncExternalStore, a nie przez useState + useEffect: nie ma osobnego
 * źródła prawdy, które mogłoby rozjechać się z tym, co widać, i nie ma
 * synchronicznego setState w efekcie (cascading render).
 *
 * `getServerSnapshot` zwraca null, bo serwer nie wie, jaki motyw ma dana
 * osoba — dzięki temu pierwszy render jest zgodny po obu stronach.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  // Zmiana motywu w innej karcie tej samej domeny.
  window.addEventListener("storage", onChange)
  return () => {
    observer.disconnect()
    window.removeEventListener("storage", onChange)
  }
}

const getSnapshot = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light"

const getServerSnapshot = (): Theme | null => null

export function ThemeToggle({ className }: { className?: string }) {
  const theme = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  function toggle() {
    const next: Theme = getSnapshot() === "dark" ? "light" : "dark"
    document.documentElement.classList.toggle("dark", next === "dark")
    document.documentElement.style.colorScheme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* brak dostępu do localStorage — motyw zadziała do końca sesji */
    }
  }

  if (theme === null) {
    // Serwer i pierwszy render klienta: rezerwujemy miejsce, żeby układ
    // nie skoczył po hydratacji.
    return <div className={cn("size-9", className)} aria-hidden />
  }

  const goingDark = theme === "light"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={goingDark ? "Włącz tryb ciemny" : "Włącz tryb jasny"}
      title={goingDark ? "Tryb ciemny" : "Tryb jasny"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {goingDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}
