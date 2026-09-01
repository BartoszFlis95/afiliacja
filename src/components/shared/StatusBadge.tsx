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
  PENDING:    { label: "Oczekuje",     bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100",   dot: "bg-amber-500" },
  APPROVED:   { label: "Zatwierdzona", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-100",    dot: "bg-blue-500" },
  CONFIRMED:  { label: "Potwierdzona", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-100",    dot: "bg-blue-500" },
  PROCESSING: { label: "W realizacji", bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-100",  dot: "bg-violet-500" },
  PAID:       { label: "Wypłacona",    bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-100",  dot: "bg-purple-500" },
  COMPLETED:  { label: "Zrealizowana", bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-100",  dot: "bg-purple-500" },
  REJECTED:   { label: "Odrzucona",    bg: "bg-red-50",     text: "text-red-700",     border: "border-red-100",     dot: "bg-red-500" },
  CANCELLED:  { label: "Anulowana",    bg: "bg-red-50",     text: "text-red-700",     border: "border-red-100",     dot: "bg-red-500" },
  DRAFT:      { label: "Szkic",        bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-100",   dot: "bg-slate-400" },
  ISSUED:     { label: "Wystawiona",   bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-100",    dot: "bg-blue-500" },
  ACTIVE:     { label: "Aktywny",      bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500" },
  INACTIVE:   { label: "Nieaktywny",   bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-100",   dot: "bg-slate-400" },
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
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-100",
    dot: "bg-slate-400",
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
