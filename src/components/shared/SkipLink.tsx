import Link from "next/link"

/**
 * Skip link — pierwszy element w kolejności tabulacji, widoczny dopiero po
 * otrzymaniu focusu.
 *
 * Bez niego osoba poruszająca się klawiaturą albo czytnikiem ekranu musi
 * przejść przez całą nawigację (na landingu to kilkanaście elementów, w
 * panelu — cały sidebar) zanim dotrze do treści, i to na KAŻDEJ podstronie.
 *
 * Cel `#main` istnieje w każdym layoucie; `<main>` ma `tabIndex={-1}`, żeby
 * po kliknięciu skip linka focus faktycznie się tam przeniósł, a nie tylko
 * przewinął stronę.
 */
export function SkipLink() {
  return (
    <Link
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      Przejdź do treści
    </Link>
  )
}
