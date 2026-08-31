import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Obejmuje CommissionStatus, PayoutStatus, ConversionStatus i InvoiceStatus —
// te cztery enumy z Prisma współdzielą część wartości (PENDING, REJECTED, PAID),
// więc jedna mapa pokrywa statusy używane w całej aplikacji. Kolory statusów
// zostają semantyczne (amber/niebieski/zielony/czerwony) mimo przejścia reszty
// UI na zinc — to uniwersalna konwencja UX, nie element brandingu.
const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  PENDING:    { label: "Oczekuje",     className: "bg-amber-50 text-amber-700",   dot: "bg-amber-500" },
  APPROVED:   { label: "Zatwierdzona", className: "bg-blue-50 text-blue-700",     dot: "bg-blue-500" },
  CONFIRMED:  { label: "Potwierdzona", className: "bg-blue-50 text-blue-700",     dot: "bg-blue-500" },
  PROCESSING: { label: "W realizacji", className: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  PAID:       { label: "Wypłacona",    className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  COMPLETED:  { label: "Zrealizowana", className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  REJECTED:   { label: "Odrzucona",    className: "bg-red-50 text-red-700",       dot: "bg-red-500" },
  CANCELLED:  { label: "Anulowana",    className: "bg-red-50 text-red-700",       dot: "bg-red-500" },
  DRAFT:      { label: "Szkic",        className: "bg-zinc-100 text-zinc-600",    dot: "bg-zinc-400" },
  ISSUED:     { label: "Wystawiona",   className: "bg-blue-50 text-blue-700",     dot: "bg-blue-500" },
  ACTIVE:     { label: "Aktywny",      className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  INACTIVE:   { label: "Nieaktywny",   className: "bg-red-50 text-red-700",       dot: "bg-red-500" },
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
    className: "bg-zinc-100 text-zinc-600",
    dot: "bg-zinc-400",
  };

  return (
    <Badge className={cn("gap-1.5 px-2 py-0.5 text-[11px]", config.className, className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} />
      {label ?? config.label}
    </Badge>
  );
}
