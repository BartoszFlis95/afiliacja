import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 hover:shadow-md",
        outline:
          "border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
        link:
          "text-zinc-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs:      "h-7 px-2.5 text-xs",
        sm:      "h-9 px-3",
        lg:      "h-11 px-8 text-base",
        icon:    "h-10 w-10",
        "icon-xs": "h-7 w-7",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Pokazuje spinner i wymusza disabled — opt-in dla formularzy z async submit. */
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  // Slot (asChild) requires exactly one child — Loader2 can only be injected
  // for a real <button>, never alongside asChild's single wrapped element.
  const content = asChild ? (
    children
  ) : (
    <>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </>
  )

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { Button, buttonVariants }
