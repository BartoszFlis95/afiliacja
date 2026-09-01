/**
 * Jedno źródło prawdy dla powierzchni kontrolek formularza.
 *
 * Input, Textarea i SelectTrigger stoją obok siebie w każdym formularzu w
 * aplikacji, więc muszą dzielić dokładnie tę samą wysokość, promień, obramowanie,
 * tło i pierścień focusu. Wcześniej każda z tych kontrolek miała własny,
 * ręcznie wpisany zestaw klas — Input był białym polem `rounded-lg`, a Select i
 * Textarea zostały ze starego motywu (`rounded-none`, przezroczyste tło, sama
 * dolna krawędź, `px-0`). W jednym formularzu wyglądały jak z dwóch różnych
 * produktów.
 *
 * Zmieniaj wygląd pól tutaj, nie w pojedynczych plikach.
 */

/** Powierzchnia pola: tło, obramowanie, promień, typografia. */
export const fieldSurface =
  "w-full rounded-lg border border-input bg-card text-sm text-foreground transition-[color,background-color,border-color,box-shadow] duration-200"

/** Placeholder — celowo jaśniejszy od tekstu pomocniczego, żeby nie czytać go jak wartość. */
export const fieldPlaceholder = "placeholder:text-muted-foreground/60"

/**
 * Focus. Pierścień jest odsunięty od `--background`, a nie od zahardkodowanej
 * bieli — dzięki temu wygląda poprawnie także na kartach i ciemnych panelach.
 */
export const fieldFocus =
  "outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background"

/**
 * Stan błędu. Wysterowany atrybutem `aria-invalid="true"`, więc ten sam znacznik
 * obsługuje warstwę wizualną i czytniki ekranu — nie ma osobnego propa `error`,
 * który dałoby się ustawić bez wersji dostępnej.
 */
export const fieldInvalid =
  "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/30"

export const fieldDisabled =
  "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"

/** Domyślna wysokość kontrolek jednowierszowych (Input, SelectTrigger). */
export const fieldHeight = "h-10 px-3 py-2"

/** Pełny zestaw dla kontrolki jednowierszowej. */
export const fieldBase = [
  fieldSurface,
  fieldHeight,
  fieldPlaceholder,
  fieldFocus,
  fieldInvalid,
  fieldDisabled,
].join(" ")

/** Pełny zestaw dla kontrolki wielowierszowej (Textarea) — bez stałej wysokości. */
export const fieldBaseMultiline = [
  fieldSurface,
  "min-h-20 px-3 py-2.5",
  fieldPlaceholder,
  fieldFocus,
  fieldInvalid,
  fieldDisabled,
].join(" ")

/**
 * Mikro-etykieta wayfindingu: nagłówki kolumn tabeli, grupy w sidebarze,
 * grupy w Select. Zarezerwowana dla etykiet — nigdy dla treści (tytuły dialogów,
 * pozycje menu, okruszki), gdzie wersaliki psują czytelność, szczególnie przy
 * polskich znakach diakrytycznych.
 */
export const microLabel =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
