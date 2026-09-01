import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Szerokość viewportu to stan spoza Reacta, więc czytamy go przez
 * useSyncExternalStore zamiast pary useState + useEffect. Poprzednia wersja
 * wołała setState synchronicznie w efekcie, co daje kaskadę renderów: pierwszy
 * render z `undefined`, natychmiastowy drugi z właściwą wartością.
 *
 * getServerSnapshot zwraca false — na serwerze nie znamy szerokości okna,
 * a desktop jest tu bezpieczniejszym domyślnym założeniem niż mobile
 * (layout i tak koryguje się od razu po hydratacji).
 */
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches
const getServerSnapshot = () => false

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
