import * as React from "react"

import { cn } from "@/lib/utils"
import { fieldBaseMultiline } from "@/components/ui/field-styles"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldBaseMultiline,
        // `field-sizing-content` rośnie z treścią; `resize-y` zostaje jako
        // ręczny fallback w przeglądarkach, które field-sizing jeszcze nie mają.
        "flex field-sizing-content resize-y leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
