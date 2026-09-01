"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"
import { THEME_STORAGE_KEY } from "@/components/shared/ThemeScript"

type Theme = "light" | "dark"

function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

/**
 * Przełącznik jasny/ciemny.
 *
 * Stan czyta z klasy na <html>, którą ustawił już ThemeScript — nie trzyma
 * własnego źródła prawdy, więc nie ma jak rozjechać się z tym, co widać.
 * Do pierwszego efektu renderuje się jako `null`: serwer nie wie, jaki motyw
 * ma dana osoba, a wyrenderowanie „na sztywno” słońca albo księżyca dałoby
 * niezgodność hydratacji.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme | null>(null)

  React.useEffect(() => {
    setTheme(currentTheme())
  }, [])

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark"
    document.documentElement.classList.toggle("dark", next === "dark")
    document.documentElement.style.colorScheme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* brak dostępu do localStorage — motyw zadziała do końca sesji */
    }
    setTheme(next)
  }

  if (theme === null) {
    // Rezerwujemy miejsce, żeby układ nie skoczył po hydratacji.
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
