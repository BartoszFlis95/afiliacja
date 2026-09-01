import * as React from "react"
import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/** Propsy, które FormField wstrzykuje do kontrolki — do rozlania na Input/Textarea/SelectTrigger. */
export type FormFieldControlProps = {
  id: string
  "aria-invalid": boolean
  "aria-describedby": string | undefined
  "aria-required": boolean | undefined
}

type FormFieldProps = {
  /** Widoczna etykieta. Gwiazdkę dla pól wymaganych dokłada `required`, nie tekst. */
  label: React.ReactNode
  /** Komunikat walidacji — zwykle `errors.pole?.message` z react-hook-form. */
  error?: string
  /** Tekst pomocniczy pod polem. Znika, gdy pojawia się błąd. */
  hint?: React.ReactNode
  required?: boolean
  className?: string
  /**
   * Id kontrolki. Domyślnie generowane — podaj własne tylko wtedy, gdy coś
   * z zewnątrz musi się do pola odwołać.
   */
  id?: string
  children: (control: FormFieldControlProps) => React.ReactNode
}

/**
 * Spina etykietę, kontrolkę i komunikat błędu w jeden dostępny blok.
 *
 * Formularze w tej aplikacji renderowały wcześniej `<Label>`, kontrolkę i
 * `<p className="text-sm text-destructive">` jako trzy niezależne elementy.
 * Nic ich nie łączyło: pole nie dostawało `aria-invalid`, więc nie miało stanu
 * błędu ani wizualnie, ani dla czytnika ekranu, a komunikat nie był powiązany
 * przez `aria-describedby`, więc osoba korzystająca z czytnika słyszała samą
 * etykietę i nie dowiadywała się, co jest nie tak.
 *
 * Komunikat niesie też ikonę, a nie sam czerwony kolor — kolor jako jedyny
 * nośnik informacji nie spełnia WCAG 1.4.1.
 */
function FormField({
  label,
  error,
  hint,
  required,
  className,
  id,
  children,
}: FormFieldProps) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`

  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {children({
        id: fieldId,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })}

      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}

      {error && (
        // role="alert" — komunikat pojawia się po submicie, więc musi zostać
        // odczytany od razu, bez przenoszenia focusu.
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

export { FormField }
