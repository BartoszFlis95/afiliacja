import { cn } from "@/lib/utils";

// Obejmuje CommissionStatus, PayoutStatus, ConversionStatus i InvoiceStatus —
// te cztery enumy z Prisma współdzielą część wartości (PENDING, REJECTED, PAID),
// więc jedna mapa pokrywa statusy używane w całej aplikacji. Kolory są celowo
// zróżnicowane per status (nie jeden wspólny "sukces = zielony") — ACTIVE to
// emerald, APPROVED/CONFIRMED to blue, PAID/COMPLETED to purple - żeby stany
// dało się rozróżnić na pierwszy rzut oka, zgodnie z premium blue redesign.
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PENDING:    { label: "Oczekuje",     bg: "bg-warning/10",   text: "text-warning",   border: "border-warning/30",   dot: "bg-warning" },
  APPROVED:   { label: "Zatwierdzona", bg: "bg-primary/10",    text: "text-primary",    border: "border-primary/20",    dot: "bg-primary" },
  CONFIRMED:  { label: "Potwierdzona", bg: "bg-primary/10",    text: "text-primary",    border: "border-primary/20",    dot: "bg-primary" },
  PROCESSING: { label: "W realizacji", bg: "bg-primary/10",  text: "text-primary",  border: "border-primary/30",  dot: "bg-primary" },
  PAID:       { label: "Wypłacona",    bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-100",  dot: "bg-purple-500" },
  COMPLETED:  { label: "Zrealizowana", bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-100",  dot: "bg-purple-500" },
  REJECTED:   { label: "Odrzucona",    bg: "bg-destructive/10",     text: "text-destructive",     border: "border-destructive/30",     dot: "bg-destructive" },
  CANCELLED:  { label: "Anulowana",    bg: "bg-destructive/10",     text: "text-destructive",     border: "border-destructive/30",     dot: "bg-destructive" },
  DRAFT:      { label: "Szkic",        bg: "bg-muted/50",   text: "text-muted-foreground",   border: "border-border/60",   dot: "bg-muted-foreground" },
  ISSUED:     { label: "Wystawiona",   bg: "bg-primary/10",    text: "text-primary",    border: "border-primary/20",    dot: "bg-primary" },
  ACTIVE:     { label: "Aktywny",      bg: "bg-success/10", text: "text-success", border: "border-success/30", dot: "bg-success" },
  INACTIVE:   { label: "Nieaktywny",   bg: "bg-muted/50",   text: "text-muted-foreground",   border: "border-border/60",   dot: "bg-muted-foreground" },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    border: "border-border/60",
    dot: "bg-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {label ?? config.label}
    </span>
  );
}
